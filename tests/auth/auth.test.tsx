import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import api, { getAccessToken, setAccessToken, clearAccessToken } from "../../lib/api";

describe("Frontend Authentication Foundation - Axios Token Lifecycle", () => {
  let originalAdapter: any;
  let mockAdapter: any;

  beforeAll(() => {
    originalAdapter = api.defaults.adapter;
  });

  afterAll(() => {
    api.defaults.adapter = originalAdapter;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    clearAccessToken();
    mockAdapter = vi.fn();
    api.defaults.adapter = mockAdapter;

    if (typeof window !== "undefined") {
      vi.stubGlobal("window", {
        ...window,
        dispatchEvent: vi.fn(),
      });
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("✓ In-Memory Token Management - Should set, get, and clear access token cleanly", () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken("test-access-token");
    expect(getAccessToken()).toBe("test-access-token");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("✓ Authorization Header Request Injection - Interceptor should append Bearer header", async () => {
    setAccessToken("test-inject-token");

    mockAdapter.mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
      data: { success: true }
    });

    await api.get("/beats");

    expect(mockAdapter).toHaveBeenCalled();
    const config = mockAdapter.mock.calls[0][0];
    expect(config.headers.Authorization).toBe("Bearer test-inject-token");
  });

  it("✓ Concurrency Queueing - 20 simultaneous 401s must trigger exactly ONE /auth/refresh and then replay successfully", async () => {
    setAccessToken("expired-token");

    let refreshCallCount = 0;
    let beatsCallCount = 0;

    mockAdapter.mockImplementation(async (config: any) => {
      if (config.url?.includes("/auth/refresh")) {
        refreshCallCount++;
        return {
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          data: {
            success: true,
            data: {
              accessToken: "new-valid-token",
              expiresIn: 900,
            },
          },
        };
      }

      if (config.url?.includes("/beats")) {
        if (config.headers?.Authorization === "Bearer new-valid-token") {
          beatsCallCount++;
          return {
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            data: { success: true, count: beatsCallCount },
          };
        }

        const err: any = new Error("Unauthorized");
        err.response = {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
          data: { success: false, message: "Token expired" }
        };
        err.config = config;
        throw err;
      }

      return { status: 200, statusText: "OK", headers: {}, config, data: {} };
    });

    // Fire 20 concurrent requests
    const promises = Array.from({ length: 20 }).map(() => api.get("/beats"));
    const results = await Promise.all(promises);

    // Assertions
    expect(refreshCallCount).toBe(1); // Exactly ONE refresh endpoint call
    expect(beatsCallCount).toBe(20);  // All 20 requests replayed and succeeded
    expect(getAccessToken()).toBe("new-valid-token"); // Access token updated in memory

    results.forEach((res) => {
      expect(res.data.success).toBe(true);
    });
  });

  it("✓ Logout during Refresh Race Condition - completed refresh must NOT restore token or authenticated state", async () => {
    setAccessToken("expired-token");

    let resolveRefresh: any;
    const refreshPromise = new Promise<any>((resolve) => {
      resolveRefresh = resolve;
    });

    mockAdapter.mockImplementation(async (config: any) => {
      if (config.url?.includes("/auth/refresh")) {
        await refreshPromise;
        return {
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          data: {
            success: true,
            data: {
              accessToken: "raced-token",
              expiresIn: 900,
            },
          },
        };
      }

      const err: any = new Error("Unauthorized");
      err.response = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
        data: { success: false, message: "Token expired" }
      };
      err.config = config;
      throw err;
    });

    // Fire request triggering refresh flow
    const pendingRequest = api.get("/beats");

    // mid-flight: user logs out
    clearAccessToken();
    expect(getAccessToken()).toBeNull();

    // Resolve the refresh request now
    resolveRefresh();

    // The replayed request should fail because session was cleared
    await expect(pendingRequest).rejects.toThrow();

    // Verify token was NOT restored in memory
    expect(getAccessToken()).toBeNull();
  });

  it("✓ Refresh Failure Dispatch - If refresh fails, clear token and fire auth-session-expired event", async () => {
    setAccessToken("expired-token");

    mockAdapter.mockImplementation(async (config: any) => {
      if (config.url?.includes("/auth/refresh")) {
        const err: any = new Error("Unauthorized");
        err.response = {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
          data: { success: false, message: "Invalid refresh token" }
        };
        throw err;
      }

      const err: any = new Error("Unauthorized");
      err.response = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
        data: { success: false, message: "Token expired" }
      };
      err.config = config;
      throw err;
    });

    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    await expect(api.get("/beats")).rejects.toThrow();

    expect(getAccessToken()).toBeNull();
    expect(dispatchEventSpy).toHaveBeenCalled();
    const event = dispatchEventSpy.mock.calls[0][0] as Event;
    expect(event.type).toBe("auth-session-expired");
  });
});
