"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 21 21" className="size-[18px]" aria-hidden="true">
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
    "h-10 w-full rounded-md border border-input bg-background px-3 text-[13.5px] text-foreground outline-none focus-visible:border-ring";
  const error = state?.error ?? ssoError;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      {microsoftEnabled && (
        <a
          href="/api/auth/microsoft/start"
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-input bg-card text-[13.5px] font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <MicrosoftMark />
          Continue with Microsoft 365
        </a>
      )}

      {microsoftEnabled && passwordLoginEnabled && (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase">
            or with email
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      {passwordLoginEnabled ? (
        <form action={formAction} className="space-y-3.5">
          <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted-foreground">
            Email
            <input name="email" type="email" required autoComplete="email" className={field} placeholder="you@company.com" />
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted-foreground">
            Password
            <input name="password" type="password" required autoComplete="current-password" className={field} placeholder="••••••••" />
          </label>
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full bg-primary text-[13.5px] font-semibold text-white hover:bg-[#0043b0]"
          >
            {pending ? "Signing in" : "Sign in"}
          </Button>
        </form>
      ) : (
        !microsoftEnabled && (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2.5 text-[12.5px] text-muted-foreground">
            No sign-in method is enabled yet. An admin can turn on password or Microsoft 365 sign-in
            in the admin console.
          </p>
        )
      )}
    </div>
  );
}
