import axios from "axios";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
const normalizedApiHost = rawApiUrl
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");
const baseURL = `${normalizedApiHost}/api`;

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required to transmit HttpOnly session cookies
});

// In-memory access token storage
let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];
let isLoggedOut = false; // Tracks if logout was triggered during active refresh

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    isLoggedOut = false; // Reset logout flag on new token set
  }
};

export const clearAccessToken = () => {
  accessToken = null;
  isLoggedOut = true;
  // Immediately reject all queued requests since the session is closed
  processQueue(new Error("Session cleared due to logout."), null);
  isRefreshing = false;
};

export const getApiErrorMessage = (error: unknown, fallback = "Request failed.") => {
  const candidate =
    typeof error === "object" && error !== null && "response" in error
      ? ((error as { response?: { data?: { error?: unknown; message?: unknown } } }).response?.data?.error ??
        (error as { response?: { data?: { message?: unknown } } }).response?.data?.message)
      : undefined;
  const message =
    candidate ??
    (typeof error === "object" && error !== null && "message" in error
      ? (error as { message?: unknown }).message
      : undefined);

  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (message && typeof message === "object" && "message" in message && typeof message.message === "string") {
    return message.message;
  }
  return fallback;
};

// Processes the queued requests waiting for a new token
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Configure request interceptor to append authorization header
api.interceptors.request.use(
  (config) => {
    // Automatically skip auth refresh for auth endpoints
    const url = config.url || "";
    if (
      url.endsWith("/auth/login") ||
      url.endsWith("/auth/signup") ||
      url.endsWith("/auth/google") ||
      url.endsWith("/auth/apple") ||
      url.endsWith("/auth/refresh") ||
      url.endsWith("/auth/logout")
    ) {
      (config as any)._skipAuthRefresh = true;
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (process.env.NODE_ENV === "development") {
      console.info(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token rotation and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a 401, is not flagged to skip refresh, and has not already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !(originalRequest as any)._skipAuthRefresh
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post("/auth/refresh");

        // Race condition check: did logout occur during refresh?
        if (isLoggedOut) {
          isRefreshing = false;
          const logoutError = new Error("Session expired due to logout during refresh.");
          processQueue(logoutError, null);
          return Promise.reject(logoutError);
        }

        const { accessToken: newToken } = refreshResponse.data.data;
        setAccessToken(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAccessToken(null);
        processQueue(refreshError, null);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-session-expired"));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
