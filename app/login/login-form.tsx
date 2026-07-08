"use client";

import { useActionState } from "react";
import { ArrowRight, KeyRound, Mail, ShieldAlert } from "lucide-react";
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
    "h-12 w-full rounded-xl border border-[#d7dfec] bg-white px-10 text-[14px] font-medium text-[#101827] outline-none transition placeholder:text-[#9aa4b2] hover:border-[#b9c7da] focus-visible:border-[#316bf3] focus-visible:ring-4 focus-visible:ring-[#316bf3]/15";
  const error = state?.error ?? ssoError;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex gap-2.5 rounded-xl border border-[#f1b7b7] bg-[#fff5f5] px-3.5 py-3 text-[12.5px] leading-5 text-[#9f1d1d]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          <p>{error}</p>
        </div>
      )}

      {microsoftEnabled && (
        <a
          href="/api/auth/microsoft/start"
          className="group relative flex h-13 w-full items-center justify-between overflow-hidden rounded-2xl border border-[#0f172a] bg-[#0b1220] px-4 text-[14px] font-semibold text-white shadow-[0_18px_45px_rgba(9,20,38,0.22)] transition hover:-translate-y-0.5 hover:bg-[#111b2e] focus-visible:ring-4 focus-visible:ring-[#316bf3]/25 focus-visible:outline-none active:translate-y-0"
        >
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.14),transparent_34%,rgba(110,160,255,.16))]" />
          <span className="relative flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-xl bg-white">
              <MicrosoftMark />
            </span>
            Continue with Microsoft 365
          </span>
          <ArrowRight className="relative size-4 text-white/70 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </a>
      )}

      {microsoftEnabled && passwordLoginEnabled && (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[#dfe6ef]" />
          <span className="text-[11px] font-bold tracking-[0.18em] text-[#8b96a6] uppercase">
            or with email
          </span>
          <span className="h-px flex-1 bg-[#dfe6ef]" />
        </div>
      )}

      {passwordLoginEnabled ? (
        <form action={formAction} className="space-y-4">
          <label className="flex flex-col gap-2 text-[12px] font-bold text-[#4b5565]">
            Work email
            <span className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#7d8796]" strokeWidth={2} />
              <input name="email" type="email" required autoComplete="email" className={field} placeholder="you@company.com" />
            </span>
          </label>
          <label className="flex flex-col gap-2 text-[12px] font-bold text-[#4b5565]">
            Password
            <span className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#7d8796]" strokeWidth={2} />
              <input name="password" type="password" required autoComplete="current-password" className={field} placeholder="Enter password" />
            </span>
          </label>
          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-2xl bg-[#0051d5] text-[14px] font-bold text-white shadow-[0_14px_30px_rgba(0,81,213,0.22)] hover:bg-[#0043b0]"
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
