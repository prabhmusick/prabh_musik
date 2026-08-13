"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppShell } from "@/app/contexts/app-shell-context";
import { useOAuth } from "@/hooks/useOAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  emailOrUsername: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  emailOrUsername?: string;
  password?: string;
  form?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(f: FormFields): FormErrors {
  const e: FormErrors = {};
  if (!f.emailOrUsername.trim()) {
    e.emailOrUsername = "Email or username is required.";
  }
  if (!f.password) {
    e.password = "Password is required.";
  }
  return e;
}

// ─── Eye icon ─────────────────────────────────────────────────────────────────

function Eye({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: "16px", height: "16px" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: "16px", height: "16px" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────

interface InputProps {
  id: keyof FormFields;
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  onChange: (id: keyof FormFields, value: string) => void;
  showToggle?: boolean;
  visible?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}

function Field({
  id, label, type = "text", value, placeholder, error,
  autoComplete, onChange, showToggle, visible, onToggle, disabled,
}: InputProps) {
  const inputType = showToggle ? (visible ? "text" : "password") : type;
  return (
    <div className="auth-input-group">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="auth-input-wrapper">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(id, e.target.value)}
          disabled={disabled}
          className={`auth-input ${error ? "error" : ""}`}
          style={showToggle ? { paddingRight: "40px" } : undefined}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Eye open={!!visible} />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="auth-error-msg">{error}</p>
      )}
    </div>
  );
}

// ─── Social Icon SVGs ────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.74-1.2 1.88-1.05 2.99 1.12.09 2.27-.58 3-1.44z" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoginForm() {
  const [fields, setFields] = useState<FormFields>({
    emailOrUsername: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAppShell();
  const { loginWithGoogle, loginWithApple, loading: oauthLoading, loadingGoogle, loadingApple } = useOAuth();

  const handleChange = useCallback(
    (id: keyof FormFields, value: string) => {
      setFields((p) => ({ ...p, [id]: value }));
      if (errors[id as keyof FormErrors]) {
        setErrors((p) => ({ ...p, [id]: undefined }));
      }
    },
    [errors]
  );

  const handleCheck = (checked: boolean) => {
    setFields((p) => ({ ...p, rememberMe: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = Object.keys(errs)[0] as keyof FormFields;
      document.getElementById(first)?.focus();
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(fields.emailOrUsername, fields.password);
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error?.message || "Invalid credentials.";
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrors({});
    try {
      await loginWithGoogle();
      setSuccess(true);
    } catch (err: any) {
      setErrors({ form: err.message || "Google Sign-In failed." });
    }
  };

  const handleAppleLogin = async () => {
    setErrors({});
    try {
      await loginWithApple();
      setSuccess(true);
    } catch (err: any) {
      setErrors({ form: err.message || "Apple Sign-In failed." });
    }
  };

  const isFormDisabled = loading || oauthLoading;

  // ── Success ──────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center", padding: "32px 0" }} role="status">
        <div style={{ display: "flex", width: "64px", height: "64px", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "rgba(245, 158, 11, 0.15)", border: "2px solid rgba(245, 158, 11, 0.3)" }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ width: "32px", height: "32px", color: "#f59e0b" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "12px 0 4px" }}>Welcome Back!</h2>
        <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.5)", maxWidth: "280px", margin: "0 auto 16px" }}>
          You've logged in successfully.
        </p>
        <button
          type="button"
          className="auth-submit-btn"
          style={{ textDecoration: "none", border: "none", display: "inline-flex", justifyContent: "center" }}
          onClick={() => {
            const redirectTo = searchParams.get("redirect") || "/";
            router.push(redirectTo);
          }}
        >
          Continue
        </button>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Log in to your account" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {errors.form && (
        <div role="alert" style={{ borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "10px 16px", fontSize: "14px", color: "#f87171" }}>
          {errors.form}
        </div>
      )}

      {/* Input Fields Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
        {/* Username or Email */}
        <Field id="emailOrUsername" label="Email Address or Username" value={fields.emailOrUsername}
          placeholder="john@example.com or john_doe" error={errors.emailOrUsername}
          autoComplete="username" onChange={handleChange} disabled={isFormDisabled} />

        {/* Password */}
        <Field id="password" label="Password" type="password" value={fields.password}
          placeholder="••••••••••" error={errors.password}
          autoComplete="current-password" onChange={handleChange}
          showToggle visible={showPw} onToggle={() => setShowPw((v) => !v)} disabled={isFormDisabled} />
      </div>

      {/* Remember Me and Forgot Password */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={fields.rememberMe}
            onChange={(e) => handleCheck(e.target.checked)}
            disabled={isFormDisabled}
            className="auth-checkbox"
          />
          <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>Remember me</span>
        </label>
        <Link href="/forgot-password" style={{ color: "#f59e0b", fontSize: "12px", textDecoration: "none" }} className="hover:underline">Forgot password?</Link>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isFormDisabled}
        aria-busy={loading}
        className="auth-submit-btn"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Logging In…
          </>
        ) : (
          "Log In"
        )}
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
        <div className="auth-divider-line" />
        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255, 255, 255, 0.3)" }}>or log in with</span>
        <div className="auth-divider-line" />
      </div>

      {/* Social buttons */}
      <div className="auth-social-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isFormDisabled}
          className="auth-social-btn"
          style={{
            opacity: loadingGoogle ? 0.96 : 1,
            transform: loadingGoogle ? "scale(0.99)" : "scale(1)",
            transition: "all 0.2s ease",
            minHeight: "44px",
          }}
          aria-live="polite"
        >
          {loadingGoogle ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Connecting…
            </>
          ) : (
            <>
              <GoogleIcon />
              Google
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleAppleLogin}
          disabled={isFormDisabled}
          className="auth-social-btn"
          style={{ minHeight: "44px" }}
        >
          {loadingApple ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Apple
            </>
          ) : (
            <>
              <AppleIcon />
              Apple
            </>
          )}
        </button>
      </div>
    </form>
  );
}
