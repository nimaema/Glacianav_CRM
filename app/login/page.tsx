import { redirect } from "next/navigation";
import { Table2, ChartNoAxesColumn, CalendarDays, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPublicAuthConfig } from "@/lib/app-config";
import { LoginForm } from "@/app/login/login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in — GlaciaNav CRM" };

const SSO_ERRORS: Record<string, string> = {
  sso_off: "Microsoft sign-in isn't configured yet.",
  sso_state: "That sign-in link expired. Please try again.",
  sso_token: "Couldn't complete Microsoft sign-in.",
  sso_profile: "Couldn't read your Microsoft profile.",
  sso_domain: "Your Microsoft account isn't in an allowed domain.",
  sso_nouser: "No account exists for that Microsoft user. Ask an admin to add you.",
};

const FEATURES = [
  { icon: Table2, title: "Validation board", desc: "Every prospect, grouped by segment, with color-coded status." },
  { icon: ChartNoAxesColumn, title: "Insights", desc: "See which needs repeat and whether the problem is confirmed." },
  { icon: CalendarDays, title: "Calendar", desc: "Interviews and follow-ups, always a glance away." },
  { icon: ShieldCheck, title: "Single sign-on", desc: "Password or your Microsoft 365 work account." },
];

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
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-deep px-12 py-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
            <path d="M12 2 L22 20 H2 Z" fill="#6ea0ff" />
            <path d="M12 2 L22 20 H12 Z" fill="#316bf3" />
          </svg>
          <span className="text-[17px] font-bold tracking-tight text-white">GlaciaNav</span>
          <span className="text-[11px] font-semibold tracking-widest text-[#6ea0ff]">CRM</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[34px] leading-[1.15] font-bold tracking-tight text-white">
            Validate before you build.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/60">
            Track customer interviews, confirm the problem is real, and watch the needs that repeat
            — the whole discovery process in one workspace.
          </p>
          <div className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <f.icon className="size-4 text-[#6ea0ff]" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-white">{f.title}</p>
                  <p className="text-[12.5px] text-white/50">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative font-mono text-[11px] tracking-wide text-white/30 uppercase">
          Executive Precision · GlaciaNav
        </p>
      </div>

      {/* Sign-in panel */}
      <div className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
              <path d="M12 2 L22 20 H2 Z" fill="#316bf3" />
              <path d="M12 2 L22 20 H12 Z" fill="#091426" />
            </svg>
            <span className="text-[16px] font-bold tracking-tight text-foreground">GlaciaNav CRM</span>
          </div>

          <h2 className="text-[22px] font-bold tracking-tight text-foreground">Sign in</h2>
          <p className="mt-1 mb-6 text-[13px] text-muted-foreground">
            Welcome back to your validation workspace.
          </p>

          <LoginForm
            passwordLoginEnabled={passwordLoginEnabled}
            microsoftEnabled={microsoftEnabled}
            ssoError={ssoError}
          />
        </div>
      </div>
    </div>
  );
}
