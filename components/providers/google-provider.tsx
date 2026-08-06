"use client";

import React, { createContext, useContext, useEffect } from "react";
import { OAuthCredential } from "../../lib/types/auth.types";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleContextValue {
  requestGoogleCredential: () => Promise<OAuthCredential>;
}

const GoogleContext = createContext<GoogleContextValue | undefined>(undefined);

// Module-level state variables to ensure single initialization and thread-safety
let isGisInitialized = false;
let activePromise: Promise<OAuthCredential> | null = null;
let resolveCredential: ((cred: OAuthCredential) => void) | null = null;
let rejectCredential: ((err: any) => void) | null = null;
let timeoutId: NodeJS.Timeout | null = null;

const REQUEST_TIMEOUT_MS = 60000; // 60 seconds

export function GoogleProvider({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Validate environment variable immediately on mount
  useEffect(() => {
    if (!googleClientId) {
      console.error("[GoogleProvider] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in the environment.");
    }
    return () => {
      // Clean up initialization state on provider unmount
      isGisInitialized = false;
      cleanupRequest(new Error("GoogleProvider unmounted. Request cancelled."));
    };
  }, [googleClientId]);

  // Clean up references and timers
  const cleanupRequest = (err: any = null) => {
    if (err && rejectCredential) {
      rejectCredential(err);
    }
    resolveCredential = null;
    rejectCredential = null;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    activePromise = null;
  };

  // Global credential response callback registered to GSI
  const handleCredentialResponse = (response: any) => {
    if (!resolveCredential) return; // Promise already resolved, rejected or timeout occurred

    if (response && response.credential) {
      resolveCredential({
        idToken: response.credential,
        nonce: undefined,
      });
    } else {
      if (rejectCredential) {
        rejectCredential(new Error("Google Identity Services returned a malformed credential response."));
      }
    }
    cleanupRequest();
  };

  const requestGoogleCredential = (): Promise<OAuthCredential> => {
    // If a request is already running, reuse the pending promise (request serialization)
    if (activePromise) {
      return activePromise;
    }

    activePromise = new Promise<OAuthCredential>((resolve, reject) => {
      if (!googleClientId) {
        return reject(new Error("Google Sign-In cannot be initiated: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing."));
      }

      if (typeof window === "undefined" || !window.google || !window.google.accounts || !window.google.accounts.id) {
        return reject(new Error("Google Identity Services SDK is not loaded or unavailable."));
      }

      resolveCredential = resolve;
      rejectCredential = reject;

      // Initialize the GIS SDK exactly once
      if (!isGisInitialized) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          cancel_on_tap_outside: false,
        });
        isGisInitialized = true;
      }

      // Add request timeout (60 seconds)
      timeoutId = setTimeout(() => {
        if (rejectCredential) {
          rejectCredential(new Error("Google Sign-In request timed out. Please try again."));
        }
        cleanupRequest();
      }, REQUEST_TIMEOUT_MS);

      // Trigger the GIS OIDC prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          if (rejectCredential) {
            rejectCredential(new Error(`Google prompt failed to display: ${notification.getNotDisplayedReason()}`));
          }
          cleanupRequest();
        } else if (notification.isSkippedMoment()) {
          if (rejectCredential) {
            rejectCredential(new Error(`Google prompt skipped: ${notification.getSkippedReason()}`));
          }
          cleanupRequest();
        } else if (notification.isDismissedMoment()) {
          if (rejectCredential) {
            rejectCredential(new Error("Google Sign-In prompt was dismissed by the user."));
          }
          cleanupRequest();
        }
      });
    });

    return activePromise;
  };

  return (
    <GoogleContext.Provider value={{ requestGoogleCredential }}>
      {children}
    </GoogleContext.Provider>
  );
}

export function useGoogle() {
  const context = useContext(GoogleContext);
  if (!context) {
    throw new Error("useGoogle must be used within a GoogleProvider");
  }
  return context;
}
