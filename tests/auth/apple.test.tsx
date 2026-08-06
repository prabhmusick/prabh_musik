import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { AppleProvider, useApple } from "../../components/providers/apple-provider";

// Helper component to execute credentials request in tests
function TestComponent({
  onCredential,
  onError,
}: {
  onCredential: (cred: any) => void;
  onError: (err: any) => void;
}) {
  const { requestAppleCredential } = useApple();
  return (
    <button
      onClick={() => {
        requestAppleCredential().then(onCredential).catch(onError);
      }}
      data-testid="request-btn"
    >
      Request
    </button>
  );
}

describe("Apple Frontend Integration - AppleProvider", () => {
  const originalEnvClient = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const originalEnvRedirect = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_APPLE_CLIENT_ID = "mock-services-id";
    process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI = "https://mock-redirect.com";

    // Setup window.AppleID mock object
    vi.stubGlobal("window", {
      ...window,
      AppleID: {
        auth: {
          init: vi.fn(),
          signIn: vi.fn().mockImplementation(() => new Promise(() => {})), // Returns pending promise by default
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    process.env.NEXT_PUBLIC_APPLE_CLIENT_ID = originalEnvClient;
    process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI = originalEnvRedirect;
  });

  it("✓ Environment Validation - Should fail if client configuration is missing", async () => {
    delete process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

    const onCredential = vi.fn();
    const onError = vi.fn();

    render(
      <AppleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </AppleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("client configuration is missing");
  });

  it("✓ SDK Initialization - Should load the SDK and trigger init with generated nonce", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    render(
      <AppleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </AppleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    const initSpy = window.AppleID.auth.init;
    const signInSpy = window.AppleID.auth.signIn;

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "mock-services-id",
        redirectURI: "https://mock-redirect.com",
        usePopup: true,
      })
    );
    expect(signInSpy).toHaveBeenCalledTimes(1);

    // Verify generated nonce was passed to initialize parameters
    const initialConfig = initSpy.mock.calls[0][0];
    expect(initialConfig.nonce).toBeDefined();
    expect(initialConfig.nonce.length).toBeGreaterThan(5);
  });

  it("✓ Request Concurrency - Multiple rapid button clicks must return the exact same Promise instance", async () => {
    let requestFn: any;
    function Consumer() {
      const { requestAppleCredential } = useApple();
      requestFn = requestAppleCredential;
      return null;
    }

    render(
      <AppleProvider>
        <Consumer />
      </AppleProvider>
    );

    let promise1: any;
    let promise2: any;

    act(() => {
      promise1 = requestFn();
      promise2 = requestFn();
    });

    // Prevent unhandled rejections
    promise1.catch(() => {});
    promise2.catch(() => {});

    expect(promise1).toBe(promise2);
    expect(window.AppleID.auth.init).toHaveBeenCalledTimes(1);
  });

  it("✓ Credential Timeout - Should reject request with a timeout error after 60 seconds", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    render(
      <AppleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </AppleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    // Advance fake timers by 60 seconds
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("Apple Sign-In request timed out");
    expect(onCredential).not.toHaveBeenCalled();
  });

  it("✓ Single Resolution - Should resolve with OAuthCredential DTO and ignore late callbacks", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    let resolver: any;
    window.AppleID.auth.signIn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        })
    );

    render(
      <AppleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </AppleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    // Resolve initial popup sign in callback
    await act(async () => {
      resolver({
        authorization: {
          id_token: "mock-apple-id-token",
        },
      });
    });

    expect(onCredential).toHaveBeenCalled();
    const result = onCredential.mock.calls[0][0];
    expect(result.idToken).toBe("mock-apple-id-token");
    expect(result.nonce).toBeDefined();

    // Trigger subsequent resolver trigger (should be ignored)
    await act(async () => {
      resolver({
        authorization: {
          id_token: "ignored-duplicate-id-token",
        },
      });
    });

    expect(onCredential).toHaveBeenCalledTimes(1);
    expect(onCredential.mock.calls[0][0].idToken).toBe("mock-apple-id-token");
  });

  it("✓ User Dismiss Rejection - Maps SDK popup closed error to user cancelled validation messages", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    window.AppleID.auth.signIn = vi.fn().mockRejectedValue({
      error: "popup_closed_by_user",
    });

    render(
      <AppleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </AppleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("dismissed by the user");
    expect(onCredential).not.toHaveBeenCalled();
  });

  it("✓ Cleanup on Unmount - Provider unmount cancels pending credentials Promise cleanly", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    const { unmount } = render(
      <AppleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </AppleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    await act(async () => {
      unmount();
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("Request cancelled");
  });
});
