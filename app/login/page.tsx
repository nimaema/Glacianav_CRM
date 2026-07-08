import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPublicAuthConfig } from "@/lib/app-config";
import { LoginForm } from "@/app/login/login-form";
import { GlaciaNavBrand } from "@/components/brand/glacianav-brand";

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
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#eef3f8] px-5 py-6 text-[#091426]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.62]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(9,20,38,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(9,20,38,.045) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(115deg, black, transparent 72%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[linear-gradient(120deg,rgba(49,107,243,0.16),rgba(255,255,255,0)_44%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0))]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-28 right-[8%] hidden h-[520px] w-[38vw] rounded-[48px] border border-white/70 bg-white/24 shadow-[0_38px_110px_rgba(36,52,77,0.16)] backdrop-blur-xl lg:block"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex h-14 items-center justify-between">
          <GlaciaNavBrand />
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-[#536174] shadow-sm backdrop-blur sm:flex">
            <ShieldCheck className="size-3.5 text-[#0051d5]" strokeWidth={2} />
            Organization SSO
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
              Access interviews, follow-ups, and board settings through your approved workspace identity.
            </p>

            <div className="mt-9 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/75 bg-white/72 p-4 shadow-sm backdrop-blur">
                <p className="text-[12px] font-semibold text-[#536174]">Authentication</p>
                <p className="mt-2 text-[18px] font-bold text-[#091426]">Entra SSO</p>
              </div>
              <div className="rounded-2xl border border-white/75 bg-white/72 p-4 shadow-sm backdrop-blur">
                <p className="text-[12px] font-semibold text-[#536174]">Workspace</p>
                <p className="mt-2 text-[18px] font-bold text-[#091426]">Admin controlled</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[390px]">
            <div className="mb-7 lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-3 py-1.5 text-[12px] font-semibold text-[#536174] shadow-sm backdrop-blur">
                <ShieldCheck className="size-3.5 text-[#0051d5]" strokeWidth={2} />
                Organization SSO
              </div>
            </div>

            <div className="rounded-[24px] border border-white/80 bg-white/82 p-6 shadow-[0_30px_90px_rgba(36,52,77,0.18)] backdrop-blur-xl">
              <div className="mb-6">
                <h2 className="text-[24px] leading-tight font-bold tracking-tight text-[#091426]">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-5 text-[#667386]">
                  Use your company SSO or workspace password.
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
