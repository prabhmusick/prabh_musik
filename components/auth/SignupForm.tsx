"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppShell } from "@/app/contexts/app-shell-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms?: string;
  form?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: FormFields): FormErrors {
  const e: FormErrors = {};
  if (!f.fullName.trim()) e.fullName = "Full name is required.";
  if (!f.username.trim()) e.username = "Username is required.";
  else if (!/^[a-z0-9_]{3,20}$/.test(f.username))
    e.username = "3–20 chars: lowercase, digits, underscores.";
  if (!f.email.trim()) e.email = "Email is required.";
  else if (!EMAIL_RE.test(f.email)) e.email = "Enter a valid email.";
  if (!f.password) e.password = "Password is required.";
  else if (f.password.length < 8) e.password = "Minimum 8 characters.";
  if (!f.confirmPassword) e.confirmPassword = "Please confirm your password.";
  else if (f.password !== f.confirmPassword) e.confirmPassword = "Passwords do not match.";
  if (!f.agreeTerms) e.agreeTerms = "You must agree to continue.";
  return e;
}

// ─── Eye icon ─────────────────────────────────────────────────────────────────

function Eye({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
}

function Field({
  id, label, type = "text", value, placeholder, error,
  autoComplete, onChange, showToggle, visible, onToggle,
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
          className={`auth-input ${error ? "error" : ""}`}
          style={showToggle ? { paddingRight: "40px" } : undefined}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
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

// ─── Google / Facebook SVGs ───────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SignupForm() {
  const [fields, setFields] = useState<FormFields>({
    fullName: "", username: "", email: "",
    password: "", confirmPassword: "", agreeTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAppShell();

  const handleChange = useCallback(
    (id: keyof FormFields, value: string) => {
      setFields((p) => ({ ...p, [id]: value }));
      if (errors[id]) setErrors((p) => ({ ...p, [id]: undefined }));
    },
    [errors]
  );

  const handleCheck = (checked: boolean) => {
    setFields((p) => ({ ...p, agreeTerms: checked }));
    if (errors.agreeTerms) setErrors((p) => ({ ...p, agreeTerms: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = Object.keys(errs)[0];
      document.getElementById(first)?.focus();
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      signup({
        fullName: fields.fullName,
        username: fields.username,
        email: fields.email,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center" role="status">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f59e0b]/20 ring-2 ring-[#f59e0b]/40">
          <svg className="h-8 w-8 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-white">You're in, {fields.fullName.split(" ")[0]}!</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Check your inbox to verify your email and start your production journey.
        </p>
        <button
          type="button"
          className="mt-2 rounded-md bg-[#f59e0b] px-8 py-2.5 text-sm font-black text-black hover:bg-[#f5a623] transition-colors"
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
    <form onSubmit={handleSubmit} noValidate aria-label="Create your account" className="flex flex-col gap-6">

      {errors.form && (
        <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {errors.form}
        </div>
      )}

      {/* Input Fields Container: Flow: Vertical, Width: Fill (384px), Gap: 16px (gap-4) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
        {/* Row 1: Full Name + Username */}
        <div className="auth-form-row">
          <Field id="fullName" label="Full Name" value={fields.fullName}
            placeholder="John Doe" error={errors.fullName}
            autoComplete="name" onChange={handleChange} />
          <Field id="username" label="Username" value={fields.username}
            placeholder="producer_one" error={errors.username}
            autoComplete="username" onChange={handleChange} />
        </div>

        {/* Row 2: Email */}
        <Field id="email" label="Email Address" type="email" value={fields.email}
          placeholder="john@example.com" error={errors.email}
          autoComplete="email" onChange={handleChange} />

        {/* Row 3: Password */}
        <Field id="password" label="Password" type="password" value={fields.password}
          placeholder="••••••••••" error={errors.password}
          autoComplete="new-password" onChange={handleChange}
          showToggle visible={showPw} onToggle={() => setShowPw((v) => !v)} />

        {/* Row 4: Confirm Password */}
        <Field id="confirmPassword" label="Confirm Password" type="password" value={fields.confirmPassword}
          placeholder="••••••••••" error={errors.confirmPassword}
          autoComplete="new-password" onChange={handleChange}
          showToggle visible={showCpw} onToggle={() => setShowCpw((v) => !v)} />
      </div>

      {/* Terms checkbox */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={fields.agreeTerms}
            onChange={(e) => handleCheck(e.target.checked)}
            className="auth-checkbox"
          />
          <span style={{ fontSize: "12px", lineHeight: "1.4", color: "rgba(255, 255, 255, 0.5)" }}>
            I agree to the{" "}
            <Link href="/terms" style={{ color: "#f59e0b", textDecoration: "none" }} className="hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "#f59e0b", textDecoration: "none" }} className="hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        {errors.agreeTerms && (
          <p role="alert" className="auth-error-msg" style={{ paddingLeft: "26px" }}>{errors.agreeTerms}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="auth-submit-btn"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Creating Account…
          </>
        ) : (
          "Create Account"
        )}
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
        <div className="auth-divider-line" />
        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255, 255, 255, 0.3)" }}>or sign up with</span>
        <div className="auth-divider-line" />
      </div>

      {/* Social buttons */}
      <div className="auth-social-grid">
        <button
          type="button"
          onClick={() => {
            // TODO: wire Google OAuth — e.g. signIn("google") from next-auth
          }}
          className="auth-social-btn"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          onClick={() => {
            // TODO: wire Facebook OAuth — e.g. signIn("facebook") from next-auth
          }}
          className="auth-social-btn"
        >
          <FacebookIcon />
          Facebook
        </button>
      </div>
    </form>
  );
}
