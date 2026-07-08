"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";

function MicrosoftMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

const FIELD =
  "h-11 w-full border border-input bg-background px-3 text-[14px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/70 hover:border-foreground/50";

type Step = "email" | "password" | "sso";

export function LoginForm({
  passwordLoginEnabled,
  microsoftEnabled,
  ssoAllowedDomain,
  ssoError,
}: {
  passwordLoginEnabled: boolean;
  microsoftEnabled: boolean;
  ssoAllowedDomain: string | null;
  ssoError: string | null;
}) {
  const [state, formAction, pending] = useActionState(login, null);
  // Email-first flow only when SSO is live; otherwise a classic combined form.
  const emailFirst = microsoftEnabled;
  const [step, setStep] = useState<Step>(emailFirst ? "email" : "password");
  const [email, setEmail] = useState("");
  const [routeError, setRouteError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const error = routeError ?? state?.error ?? ssoError;

  useEffect(() => {
    if (step === "password" && emailFirst) passwordRef.current?.focus();
  }, [step, emailFirst]);

  // Landing on the SSO step hands off to Microsoft; the button is the fallback.
  useEffect(() => {
    if (step !== "sso") return;
    const t = setTimeout(() => window.location.assign("/api/auth/microsoft/start"), 400);
    return () => clearTimeout(t);
  }, [step]);

  const goToEmail = () => {
    setRouteError(null);
    setStep("email");
  };

  const onContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setRouteError(null);
    const value = email.trim().toLowerCase();
    const domain = value.split("@")[1] ?? "";
    if (!value || !domain.includes(".")) {
      setRouteError("Enter a valid work email.");
      return;
    }
    setEmail(value);
    if (ssoAllowedDomain && domain === ssoAllowedDomain) {
      setStep("sso");
      return;
    }
    if (passwordLoginEnabled) {
      setStep("password");
      return;
    }
    if (ssoAllowedDomain) {
      setRouteError(`Use your @${ssoAllowedDomain} email to sign in with Microsoft 365.`);
      return;
    }
    setStep("sso");
  };

  // Neither method configured.
  if (!microsoftEnabled && !passwordLoginEnabled) {
    return (
      <div className="flex border" role="status">
        <span className="blaze" aria-hidden="true" />
        <p className="px-3 py-2.5 text-[13px] leading-5 text-muted-foreground">
          No sign-in method is enabled yet. An admin can turn on password or
          Microsoft 365 sign-in in the admin console.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex border border-destructive/40" role="alert">
          <span className="blaze" aria-hidden="true" />
          <p className="px-3 py-2.5 text-[13px] leading-5 text-destructive">{error}</p>
        </div>
      )}

      {/* ---- SSO hand-off ---- */}
      {step === "sso" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 border bg-secondary px-3 py-2.5">
            <MicrosoftMark className="size-5" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">{email}</p>
              <p className="type-legend text-muted-foreground">Microsoft 365 · redirecting</p>
            </div>
          </div>
          <a
            href="/api/auth/microsoft/start"
            className="flex h-11 w-full items-center justify-center gap-2.5 bg-foreground text-[13.5px] font-semibold text-background transition-colors duration-150 hover:bg-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <MicrosoftMark />
            Continue with Microsoft 365
          </a>
          <button
            type="button"
            onClick={goToEmail}
            className="type-legend text-muted-foreground transition-colors hover:text-foreground"
          >
            Use a different email
          </button>
        </div>
      ) : step === "email" ? (
        /* ---- Step 1: email ---- */
        <form onSubmit={onContinue} className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="type-legend text-foreground">Work email</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD}
              placeholder="you@company.com"
            />
          </label>
          <Button type="submit" className="h-11 w-full text-[14px] font-semibold">
            Continue
          </Button>

          {/* Fallback when SSO is on but no domain is configured to route by. */}
          {microsoftEnabled && !ssoAllowedDomain && (
            <>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="type-legend text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <a
                href="/api/auth/microsoft/start"
                className="flex h-11 w-full items-center justify-center gap-2.5 border border-foreground bg-background text-[13.5px] font-semibold transition-colors duration-150 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <MicrosoftMark />
                Continue with Microsoft 365
              </a>
            </>
          )}

          <p className="text-[12px] leading-5 text-muted-foreground">
            Authorized GlaciaNav workspace members only.
          </p>
        </form>
      ) : (
        /* ---- Step 2: password ---- */
        <form action={formAction} className="space-y-4">
          {emailFirst ? (
            <>
              <div className="flex items-center justify-between gap-2 border bg-secondary px-3 py-2.5">
                <span className="truncate text-[13px] font-medium text-foreground">{email}</span>
                <button
                  type="button"
                  onClick={goToEmail}
                  className="type-legend shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  Change
                </button>
              </div>
              <input type="hidden" name="email" value={email} />
            </>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="type-legend text-foreground">Work email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD}
                placeholder="you@company.com"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="type-legend text-foreground">Password</span>
            <input
              ref={passwordRef}
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={FIELD}
              placeholder="Enter password"
            />
          </label>
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full text-[14px] font-semibold"
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-[12px] leading-5 text-muted-foreground">
            Authorized GlaciaNav workspace members only.
          </p>
        </form>
      )}
    </div>
  );
}
