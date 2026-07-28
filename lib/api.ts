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
});

// Configure request interceptor to log URLs in development mode
if (process.env.NODE_ENV === "development") {
  api.interceptors.request.use(
    (config) => {
      console.info(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );
}

// Response interceptor returning the response object unchanged
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
