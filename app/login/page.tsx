import { redirect } from "next/navigation";
import { Activity, CalendarDays, ChartNoAxesColumn, ShieldCheck, Table2 } from "lucide-react";
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

const SIGNALS = [
  { label: "Problem confirmed", value: "72%", tone: "bg-emerald-500" },
  { label: "Follow-ups due", value: "11", tone: "bg-amber-500" },
  { label: "Validated leads", value: "24", tone: "bg-blue-500" },
];

const PIPELINE = [
  { name: "Alpin Zermatt", stage: "Validated", color: "bg-emerald-500", width: "w-[84%]" },
  { name: "Jotunheimen Guides", stage: "Interviewed", color: "bg-amber-500", width: "w-[66%]" },
  { name: "Arctic Trails", stage: "Scheduled", color: "bg-violet-500", width: "w-[48%]" },
];

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={[
          "relative flex size-9 items-center justify-center overflow-hidden rounded-[10px]",
          light ? "bg-white text-[#091426]" : "bg-[#091426] text-white",
        ].join(" ")}
        aria-hidden="true"
      >
        <span className="absolute inset-x-1 bottom-1 h-3 rounded-t-full bg-[#6ea0ff]" />
        <span className="relative size-0 border-x-[8px] border-b-[15px] border-x-transparent border-b-current" />
      </span>
      <span className={light ? "text-white" : "text-foreground"}>
        <span className="block text-[15px] leading-none font-bold tracking-tight">GlaciaNav</span>
        <span className={light ? "text-[10px] font-semibold tracking-[0.24em] text-white/45" : "text-[10px] font-semibold tracking-[0.24em] text-muted-foreground"}>
          CRM
        </span>
      </span>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -top-10 right-10 h-32 w-32 rounded-full bg-[#6ea0ff]/20 blur-3xl" />
      <div className="absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-white/14 bg-white/[0.08] shadow-2xl shadow-black/30 backdrop-blur">
        <div className="flex h-12 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff6b6b]" />
            <span className="size-2.5 rounded-full bg-[#ffd166]" />
            <span className="size-2.5 rounded-full bg-[#06d6a0]" />
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 font-mono text-[11px] text-white/55">
            crm.glacianav.com
          </div>
        </div>

        <div className="grid gap-3.5 p-4">
          <div className="grid grid-cols-3 gap-3">
            {SIGNALS.map((signal) => (
              <div key={signal.label} className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${signal.tone}`} />
                  <span className="truncate text-[11px] font-medium text-white/52">{signal.label}</span>
                </div>
                <p className="mt-2 text-[23px] font-bold tracking-tight text-white">{signal.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-white">Customer Validation</p>
                <p className="text-[11.5px] text-white/42">Live pipeline signal</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                <Activity className="size-3" strokeWidth={2} />
                Active
              </div>
            </div>

            <div className="space-y-2.5">
              {PIPELINE.map((row) => (
                <div key={row.name} className="rounded-xl border border-white/8 bg-white/[0.05] p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-[12.5px] font-semibold text-white/85">{row.name}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold text-white/64">
                      {row.stage}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${row.color} ${row.width}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1.15fr] gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3.5">
              <CalendarDays className="mb-2.5 size-4 text-[#9fbfff]" strokeWidth={2} />
              <p className="text-[12px] font-semibold text-white">Interviews</p>
              <p className="mt-1 text-[11.5px] text-white/45">4 scheduled this week</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3.5">
              <div className="mb-2.5 flex items-center gap-2 text-[#9fbfff]">
                <Table2 className="size-4" strokeWidth={2} />
                <ChartNoAxesColumn className="size-4" strokeWidth={2} />
                <ShieldCheck className="size-4" strokeWidth={2} />
              </div>
              <p className="text-[12px] font-semibold text-white">Secure workspace</p>
              <p className="mt-1 text-[11.5px] text-white/45">Protected with Microsoft 365 SSO</p>
            </div>
          </div>
        </div>
      </div>
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
    <main className="min-h-[100dvh] overflow-hidden bg-[#eef3f8] text-foreground lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <section className="relative hidden min-h-[100dvh] overflow-hidden bg-[#07111f] px-10 py-6 lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(49,107,243,.32),transparent_30%),radial-gradient(circle_at_84%_72%,rgba(21,128,61,.18),transparent_28%)]" />

        <div className="relative flex items-center justify-between">
          <BrandMark light />
          <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/55">
            Secure access
          </span>
        </div>

        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-5">
          <div className="max-w-xl">
            <h1 className="text-[38px] leading-[1.04] font-bold tracking-tight text-white xl:text-[46px]">
              Customer validation, behind one trusted door.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-6 text-white/58">
              Sign in to manage interviews, follow-ups, and validation signals in the same workspace.
            </p>
          </div>
          <ProductPreview />
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[11.5px] text-white/40">
          <span>GlaciaNav CRM</span>
          <span>Microsoft 365 ready</span>
        </div>
      </section>

      <section className="flex min-h-[100dvh] items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>

          <div className="rounded-[28px] border border-white bg-white/82 p-5 shadow-[0_24px_80px_rgba(9,20,38,0.12)] backdrop-blur sm:p-7">
            <div className="mb-7">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d8e2f1] bg-[#f8fbff] px-3 py-1 text-[11.5px] font-semibold text-[#31537f]">
                <ShieldCheck className="size-3.5" strokeWidth={2} />
                Protected workspace
              </span>
              <h2 className="text-[27px] leading-tight font-bold tracking-tight text-[#091426]">
                Welcome back
              </h2>
              <p className="mt-2 text-[13.5px] leading-5 text-[#5c6575]">
                Continue with your work account or sign in with email.
              </p>
            </div>

            <LoginForm
              passwordLoginEnabled={passwordLoginEnabled}
              microsoftEnabled={microsoftEnabled}
              ssoError={ssoError}
            />
          </div>

          <p className="mt-5 text-center text-[12px] leading-5 text-[#6d7583]">
            Access is limited to authorized GlaciaNav workspace members.
          </p>
        </div>
      </section>
    </main>
  );
}
