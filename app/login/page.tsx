import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPublicAuthConfig } from "@/lib/app-config";
import { LoginForm } from "@/app/login/login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in - GlaciaNav CRM" };

const SSO_ERRORS: Record<string, string> = {
  sso_off: "Microsoft sign-in isn't configured yet.",
  sso_state: "That sign-in link expired. Please try again.",
  sso_token: "Couldn't complete Microsoft sign-in.",
  sso_profile: "Couldn't read your Microsoft profile.",
  sso_domain: "Your Microsoft account isn't in an allowed domain.",
  sso_nouser: "No account exists for that Microsoft user. Ask an admin to add you.",
};

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl bg-[#091426] text-white shadow-sm">
        <span className="absolute inset-x-1 bottom-1 h-3 rounded-t-full bg-[#6ea0ff]" />
        <span className="relative size-0 border-x-[8px] border-b-[15px] border-x-transparent border-b-current" />
      </span>
      <span>
        <span className="block text-[15px] leading-none font-bold tracking-tight text-[#091426]">
          GlaciaNav
        </span>
        <span className="text-[10px] font-semibold tracking-[0.24em] text-[#7c8798]">
          CRM
        </span>
      </span>
    </div>
  );
}

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/");
  const [{ passwordLoginEnabled, microsoftEnabled }, { error }] = await Promise.all([
    getPublicAuthConfig(),
    props.searchParams,
  ]);
  const ssoError = error ? (SSO_ERRORS[error] ?? "Sign-in failed. Please try again.") : null;

  return (
    <main className="min-h-[100dvh] bg-[#f4f7fb] px-5 py-6 text-[#091426]">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex h-14 items-center justify-between">
          <BrandMark />
          <div className="hidden items-center gap-2 rounded-full border border-[#d9e2ef] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#536174] shadow-sm sm:flex">
            <ShieldCheck className="size-3.5 text-[#0051d5]" strokeWidth={2} />
            Secure workspace
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.7fr)]">
          <div className="hidden max-w-xl lg:block">
            <div className="mb-8 inline-flex size-12 items-center justify-center rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
              <LockKeyhole className="size-5 text-[#0051d5]" strokeWidth={2} />
            </div>
            <h1 className="max-w-lg text-[44px] leading-[1.04] font-bold tracking-tight text-[#091426]">
              Sign in to your validation workspace.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-6 text-[#5f6b7a]">
              Access customer interviews, follow-ups, and board settings from one protected CRM.
            </p>

            <div className="mt-9 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
                <p className="text-[12px] font-semibold text-[#536174]">Authentication</p>
                <p className="mt-2 text-[18px] font-bold text-[#091426]">Microsoft ready</p>
              </div>
              <div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
                <p className="text-[12px] font-semibold text-[#536174]">Workspace</p>
                <p className="mt-2 text-[18px] font-bold text-[#091426]">Admin controlled</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[390px]">
            <div className="mb-7 lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e2ef] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#536174] shadow-sm">
                <ShieldCheck className="size-3.5 text-[#0051d5]" strokeWidth={2} />
                Secure workspace
              </div>
            </div>

            <div className="rounded-[22px] border border-[#d9e2ef] bg-white p-6 shadow-[0_24px_70px_rgba(36,52,77,0.12)]">
              <div className="mb-6">
                <h2 className="text-[24px] leading-tight font-bold tracking-tight text-[#091426]">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-5 text-[#667386]">
                  Use Microsoft SSO or your workspace password.
                </p>
              </div>

              <LoginForm
                passwordLoginEnabled={passwordLoginEnabled}
                microsoftEnabled={microsoftEnabled}
                ssoError={ssoError}
              />
            </div>

            <p className="mt-4 text-center text-[12px] leading-5 text-[#758194]">
              Authorized GlaciaNav workspace members only.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
