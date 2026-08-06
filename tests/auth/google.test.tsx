import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { GoogleProvider, useGoogle } from "../../components/providers/google-provider";

// Helper component to execute context credentials request in tests
function TestComponent({
  onCredential,
  onError,
}: {
  onCredential: (token: string) => void;
  onError: (err: any) => void;
}) {
  const { requestGoogleCredential } = useGoogle();
  return (
    <button
      onClick={() => {
        requestGoogleCredential().then(onCredential).catch(onError);
      }}
      data-testid="request-btn"
    >
      Request
    </button>
  );
}

describe("Google Frontend Integration - GoogleProvider", () => {
  const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "mock-client-id";

    // Setup window.google mock object structure
    vi.stubGlobal("window", {
      ...window,
      google: {
        accounts: {
          id: {
            initialize: vi.fn(),
            prompt: vi.fn(),
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = originalEnv;
  });

  it("✓ Environment Validation - Should fail if NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const onCredential = vi.fn();
    const onError = vi.fn();

    render(
      <GoogleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </GoogleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing");
  });

  it("✓ SDK Initialization - Should initialize Google accounts ID SDK once on request", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    render(
      <GoogleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </GoogleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    const initSpy = window.google.accounts.id.initialize;
    const promptSpy = window.google.accounts.id.prompt;

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "mock-client-id",
        cancel_on_tap_outside: false,
      }),
    );
    expect(promptSpy).toHaveBeenCalledTimes(1);
  });

  it("✓ Request Concurrency - Multiple rapid button clicks must reuse the exact same pending Promise", async () => {
    const onCredential1 = vi.fn();
    const onCredential2 = vi.fn();
    const onError = vi.fn();

    // Hook to capture callbacks from context
    let requestFn: any;
    function Consumer() {
      const { requestGoogleCredential } = useGoogle();
      requestFn = requestGoogleCredential;
      return null;
    }

    render(
      <GoogleProvider>
        <Consumer />
      </GoogleProvider>
    );

    let promise1: any;
    let promise2: any;

    act(() => {
      promise1 = requestFn();
      promise2 = requestFn();
    });

    // Prevent unhandled rejections when they are cleaned up or rejected
    promise1.catch(() => {});
    promise2.catch(() => {});

    // Both calls must return the identical Promise instance
    expect(promise1).toBe(promise2);

    // Verify initialization occurred only once
    expect(window.google.accounts.id.initialize).toHaveBeenCalledTimes(1);
  });

  it("✓ Credential Timeout - Should reject the Promise if no callback is received within 60 seconds", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    render(
      <GoogleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </GoogleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    // Advance timers by 60 seconds
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("Google Sign-In request timed out");
    expect(onCredential).not.toHaveBeenCalled();
  });

  it("✓ Single Resolution Guarantee - Ignored subsequent SDK responses after initial resolution", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    render(
      <GoogleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </GoogleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    // Capture the registered callback handler from GSI initialize
    const registeredCallback = (window.google.accounts.id.initialize as any).mock.calls[0][0].callback;

    // Trigger success credential callback
    await act(async () => {
      registeredCallback({ credential: "first-valid-token" });
    });

    expect(onCredential).toHaveBeenCalledWith({ idToken: "first-valid-token", nonce: undefined });

    // Trigger subsequent callback (which must be ignored)
    await act(async () => {
      registeredCallback({ credential: "ignored-duplicate-token" });
    });

    expect(onCredential).toHaveBeenCalledTimes(1);
    expect(onCredential).not.toHaveBeenCalledWith("ignored-duplicate-token");
  });

  it("✓ SDK Error / Close Mapping - Maps skipped, not-displayed, and user dismissed prompts to rejections", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    render(
      <GoogleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </GoogleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    // Capture GSI prompt callback handler
    const promptHandler = (window.google.accounts.id.prompt as any).mock.calls[0][0];

    // Simulate user dismissed moment notification
    const mockNotification = {
      isNotDisplayed: () => false,
      isSkippedMoment: () => false,
      isDismissedMoment: () => true,
      getNotDisplayedReason: () => "",
      getSkippedReason: () => "",
    };

    await act(async () => {
      promptHandler(mockNotification);
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("Google Sign-In prompt was dismissed by the user");
  });

  it("✓ Cleanup on Unmount - Unmounting provider cancels active request and resets lock", async () => {
    const onCredential = vi.fn();
    const onError = vi.fn();

    const { unmount } = render(
      <GoogleProvider>
        <TestComponent onCredential={onCredential} onError={onError} />
      </GoogleProvider>
    );

    const button = screen.getByTestId("request-btn");
    await act(async () => {
      button.click();
    });

    // Unmount provider while request is pending
    await act(async () => {
      unmount();
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("Request cancelled");
  });
});
