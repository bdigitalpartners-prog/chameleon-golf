"use client";

export const dynamic = "force-dynamic";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { trackSignUp, trackSignIn } from "@/lib/analytics";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (mode === "register") {
      if (!firstName.trim()) errors.firstName = "First name is required";
      if (!lastName.trim()) errors.lastName = "Last name is required";
      if (password.length < 8)
        errors.password = "Password must be at least 8 characters";
      if (password !== confirmPassword)
        errors.confirmPassword = "Passwords do not match";
    }

    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Invalid email format";

    if (!password) errors.password = errors.password || "Password is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Registration failed");
          setLoading(false);
          return;
        }

        // Auto sign-in after registration
        const signInResult = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError("Account created. Please sign in.");
          setMode("login");
          setLoading(false);
          return;
        }

        trackSignUp("credentials");
        window.location.href = callbackUrl;
      } else {
        const result = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }

        trackSignIn("credentials");
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: "var(--cg-bg-tertiary)",
    border: "1px solid var(--cg-border)",
    color: "var(--cg-text-primary)",
  };

  const inputErrorStyle = {
    ...inputStyle,
    border: "1px solid var(--cg-error)",
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
        }}
      >
        <img
          src="/golfEQUALIZER_wordmark.svg"
          alt="golfEQUALIZER"
          className="mx-auto mb-6 h-10"
        />

        <h1
          className="mb-2 text-center text-2xl font-bold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p
          className="mb-6 text-center text-sm"
          style={{ color: "var(--cg-text-muted)" }}
        >
          {mode === "login"
            ? "Sign in to access your circles, track scores, and discover courses."
            : "Join golfEQUALIZER to discover and rank courses tailored to your game."}
        </p>

        {error && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--cg-error)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setFieldErrors((p) => ({ ...p, firstName: "" }));
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
                  style={{
                    ...(fieldErrors.firstName ? inputErrorStyle : inputStyle),
                    "--tw-ring-color": "var(--cg-accent)",
                  } as React.CSSProperties}
                  placeholder="John"
                />
                {fieldErrors.firstName && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--cg-error)" }}
                  >
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setFieldErrors((p) => ({ ...p, lastName: "" }));
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
                  style={{
                    ...(fieldErrors.lastName ? inputErrorStyle : inputStyle),
                    "--tw-ring-color": "var(--cg-accent)",
                  } as React.CSSProperties}
                  placeholder="Doe"
                />
                {fieldErrors.lastName && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--cg-error)" }}
                  >
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: "" }));
              }}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
              style={{
                ...(fieldErrors.email ? inputErrorStyle : inputStyle),
                "--tw-ring-color": "var(--cg-accent)",
              } as React.CSSProperties}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs" style={{ color: "var(--cg-error)" }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((p) => ({ ...p, password: "" }));
              }}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
              style={{
                ...(fieldErrors.password ? inputErrorStyle : inputStyle),
                "--tw-ring-color": "var(--cg-accent)",
              } as React.CSSProperties}
              placeholder={
                mode === "register" ? "Min. 8 characters" : "Your password"
              }
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs" style={{ color: "var(--cg-error)" }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          {mode === "register" && (
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
                style={{
                  ...(fieldErrors.confirmPassword
                    ? inputErrorStyle
                    : inputStyle),
                  "--tw-ring-color": "var(--cg-accent)",
                } as React.CSSProperties}
                placeholder="Re-enter your password"
              />
              {fieldErrors.confirmPassword && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--cg-error)" }}
                >
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setFieldErrors({});
            }}
            className="text-sm transition-colors hover:underline"
            style={{ color: "var(--cg-accent)" }}
          >
            {mode === "login"
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <p
          className="mt-4 text-center text-xs"
          style={{ color: "var(--cg-text-muted)", opacity: 0.6 }}
        >
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
