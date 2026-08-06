import { useState } from "react";
import { useGoogle } from "../components/providers/google-provider";
import { useApple } from "../components/providers/apple-provider";
import { useAppShell } from "../app/contexts/app-shell-context";

/**
 * Hook to coordinate OAuth social logins (Google & Apple) for UI forms.
 * Manages loading spinners, popup cancellation, SDK unavailable, and backend rejection mapping.
 */
export function useOAuth() {
  const { requestGoogleCredential } = useGoogle();
  const { requestAppleCredential } = useApple();
  const { loginWithGoogle: contextLoginWithGoogle, loginWithApple: contextLoginWithApple } = useAppShell();

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      const { idToken } = await requestGoogleCredential();
      await contextLoginWithGoogle(idToken);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        "Google Sign-In failed.";
      
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const loginWithApple = async () => {
    setLoadingApple(true);
    setError(null);
    try {
      const { idToken, nonce } = await requestAppleCredential();
      await contextLoginWithApple(idToken, nonce);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        "Apple Sign-In failed.";

      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoadingApple(false);
    }
  };

  return {
    loginWithGoogle,
    loginWithApple,
    loading: loadingGoogle || loadingApple,
    loadingGoogle,
    loadingApple,
    error,
  };
}
