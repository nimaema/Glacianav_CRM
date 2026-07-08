"use client";

import { useActionState } from "react";
import { KeyRound, Mail, ShieldAlert } from "lucide-react";
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
    "h-10 w-full rounded-lg border border-[#d7dfec] bg-white px-9 text-[13.5px] font-medium text-[#101827] outline-none transition placeholder:text-[#9aa4b2] hover:border-[#b9c7da] focus-visible:border-[#316bf3] focus-visible:ring-3 focus-visible:ring-[#316bf3]/15";
  const error = state?.error ?? ssoError;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex gap-2.5 rounded-xl border border-[#f1b7b7] bg-[#fff5f5] px-3.5 py-3 text-[12.5px] leading-5 text-[#9f1d1d]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          <p>{error}</p>
        </div>
      )}

      {microsoftEnabled && (
        <a
          href="/api/auth/microsoft/start"
          className="inline-flex h-10 items-center gap-2.5 rounded-lg border border-[#cfd8e6] bg-[#f8fafc] px-3.5 text-[13px] font-semibold text-[#172033] shadow-sm transition hover:border-[#b9c7da] hover:bg-white focus-visible:ring-3 focus-visible:ring-[#316bf3]/20 focus-visible:outline-none"
        >
          <MicrosoftMark />
          Microsoft
        </a>
      )}

      {microsoftEnabled && passwordLoginEnabled && (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[#dfe6ef]" />
          <span className="text-[10.5px] font-bold tracking-[0.16em] text-[#8b96a6] uppercase">
            Email
          </span>
          <span className="h-px flex-1 bg-[#dfe6ef]" />
        </div>
      )}

      {passwordLoginEnabled ? (
        <form action={formAction} className="space-y-3.5">
          <label className="flex flex-col gap-1.5 text-[12px] font-bold text-[#4b5565]">
            Work email
            <span className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#7d8796]" strokeWidth={2} />
              <input name="email" type="email" required autoComplete="email" className={field} placeholder="you@company.com" />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-bold text-[#4b5565]">
            Password
            <span className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#7d8796]" strokeWidth={2} />
              <input name="password" type="password" required autoComplete="current-password" className={field} placeholder="Enter password" />
            </span>
          </label>
          <Button
            type="submit"
            disabled={pending}
            className="h-10 w-full rounded-lg bg-[#0051d5] text-[13.5px] font-bold text-white shadow-sm hover:bg-[#0043b0]"
          >
            {pending ? "Signing in" : "Sign in"}
          </Button>
        </form>
      ) : (
        !microsoftEnabled && (
          <p className="rounded-xl border border-[#d7dfec] bg-[#f8fbff] px-3.5 py-3 text-[12.5px] leading-5 text-[#5c6575]">
            No sign-in method is enabled yet. An admin can turn on password or Microsoft 365 sign-in
            in the admin console.
          </p>
        )
      )}
    </div>
  );
}
