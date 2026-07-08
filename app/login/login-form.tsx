"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 21 21" className="size-4" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export function LoginForm({
  passwordLoginEnabled,
  microsoftEnabled,
  ssoError,
}: {
  passwordLoginEnabled: boolean;
  microsoftEnabled: boolean;
  ssoError: string | null;
}) {
  const [state, formAction, pending] = useActionState(login, null);
  const field =
    "h-11 w-full border border-input bg-background px-3 text-[14px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/70 hover:border-foreground/50";
  const error = state?.error ?? ssoError;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex border border-destructive/40" role="alert">
          <span className="blaze" aria-hidden="true" />
          <p className="px-3 py-2.5 text-[13px] leading-5 text-destructive">
            {error}
          </p>
        </div>
      )}

      {microsoftEnabled && (
        <a
          href="/api/auth/microsoft/start"
          className="flex h-11 w-full items-center justify-center gap-2.5 border border-foreground bg-background text-[13.5px] font-semibold transition-colors duration-150 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <MicrosoftMark />
          Continue with Microsoft 365
        </a>
      )}

      {microsoftEnabled && passwordLoginEnabled && (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="type-legend text-muted-foreground">or email</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      {passwordLoginEnabled ? (
        <form action={formAction} className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="type-legend text-foreground">Work email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={field}
              placeholder="you@company.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="type-legend text-foreground">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={field}
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
      ) : (
        !microsoftEnabled && (
          <div className="flex border" role="status">
            <span className="blaze" aria-hidden="true" />
            <p className="px-3 py-2.5 text-[13px] leading-5 text-muted-foreground">
              No sign-in method is enabled yet. An admin can turn on password or
              Microsoft 365 sign-in in the admin console.
            </p>
          </div>
        )
      )}
    </div>
  );
}
