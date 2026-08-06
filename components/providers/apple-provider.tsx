"use client";

import React, { createContext, useContext, useEffect } from "react";
import { OAuthCredential } from "../../lib/types/auth.types";

declare global {
  interface Window {
    AppleID?: any;
  }
}

interface AppleContextValue {
  requestAppleCredential: () => Promise<OAuthCredential>;
}

const AppleContext = createContext<AppleContextValue | undefined>(undefined);

// Module-level variables to ensure thread-safety, serialization, and single-init
let isAppleInitialized = false;
let activePromise: Promise<OAuthCredential> | null = null;
let resolveCredential: ((cred: OAuthCredential) => void) | null = null;
let rejectCredential: ((err: any) => void) | null = null;
let timeoutId: NodeJS.Timeout | null = null;

const REQUEST_TIMEOUT_MS = 60000; // 60 seconds

export function AppleProvider({ children }: { children: React.ReactNode }) {
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

  // Validate environment configuration immediately on mount
  useEffect(() => {
    if (!appleClientId || !appleRedirectUri) {
      console.error(
        "[AppleProvider] Apple Sign-In configuration error: NEXT_PUBLIC_APPLE_CLIENT_ID or NEXT_PUBLIC_APPLE_REDIRECT_URI is missing."
      );
    }
    return () => {
      // Clear initialization lock and requests on unmount
      isAppleInitialized = false;
      cleanupRequest(new Error("AppleProvider unmounted. Request cancelled."));
    };
  }, [appleClientId, appleRedirectUri]);

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

  const requestAppleCredential = (): Promise<OAuthCredential> => {
    // If a request is already running, serialize and reuse the pending Promise
    if (activePromise) {
      return activePromise;
    }

    activePromise = new Promise<OAuthCredential>((resolve, reject) => {
      if (!appleClientId || !appleRedirectUri) {
        return reject(
          new Error("Apple Sign-In cannot be initiated: client configuration is missing.")
        );
      }

      if (typeof window === "undefined" || !window.AppleID || !window.AppleID.auth) {
        return reject(new Error("Apple Sign-In SDK is not loaded or unavailable."));
      }

      resolveCredential = resolve;
      rejectCredential = reject;

      // Generate a secure random nonce for replay protection
      const generatedNonce =
        Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

      // Initialize the Apple Sign-In SDK exactly once
      if (!isAppleInitialized) {
        window.AppleID.auth.init({
          clientId: appleClientId,
          scope: "name email",
          redirectURI: appleRedirectUri,
          nonce: generatedNonce,
          usePopup: true,
        });
        isAppleInitialized = true;
      }

      // Add request timeout (60 seconds)
      timeoutId = setTimeout(() => {
        if (rejectCredential) {
          rejectCredential(new Error("Apple Sign-In request timed out. Please try again."));
        }
        cleanupRequest();
      }, REQUEST_TIMEOUT_MS);

      // Trigger the Apple Sign-In popup flow
      window.AppleID.auth.signIn()
        .then((response: any) => {
          if (!resolveCredential) return; // Ignore if timeout/error already triggered

          if (response && response.authorization && response.authorization.id_token) {
            resolveCredential({
              idToken: response.authorization.id_token,
              nonce: generatedNonce,
            });
          } else {
            if (rejectCredential) {
              rejectCredential(new Error("Apple JS SDK returned a malformed authorization response."));
            }
          }
          cleanupRequest();
        })
        .catch((error: any) => {
          if (!rejectCredential) return;

          // Map standard user dismissal and popup cancelled errors
          const errorMsg =
            error && error.error === "popup_closed_by_user"
              ? "Apple Sign-In prompt was dismissed by the user."
              : (error && error.message) || "Apple Sign-In popup execution failed.";

          rejectCredential(new Error(errorMsg));
          cleanupRequest();
        });
    });

    return activePromise;
  };

  return (
    <AppleContext.Provider value={{ requestAppleCredential }}>
      {children}
    </AppleContext.Provider>
  );
}

export function useApple() {
  const context = useContext(AppleContext);
  if (!context) {
    throw new Error("useApple must be used within an AppleProvider");
  }
  return context;
}
