import { redirect } from "next/navigation";
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

const STAGES = [
  "Not contacted",
  "Reached out",
  "Scheduled",
  "Interviewed",
  "Validated",
];

/* Swisstopo-style cross-section: filled terrain, hairline elevation grid,
   red route to the summit. The same diagram becomes the data-bound Ascent
   hero on the dashboard. */
function CrossSection() {
  return (
    <svg viewBox="0 0 560 190" className="w-full" aria-hidden="true" fill="none">
      {/* glacier body under the terrain */}
      <path
        d="M0,175 L70,150 L130,158 L210,108 L268,122 L340,58 L396,74 L460,30 L560,14 L560,190 L0,190 Z"
        fill="#33688c"
        opacity="0.08"
      />
      {/* elevation grid */}
      {[20, 60, 100, 140, 180].map((y) => (
        <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--border)" strokeWidth="1" />
      ))}
      <text x="0" y="16" className="fill-muted-foreground font-mono" fontSize="9" letterSpacing="1">3400</text>
      <text x="0" y="56" className="fill-muted-foreground font-mono" fontSize="9" letterSpacing="1">3000</text>
      <text x="0" y="96" className="fill-muted-foreground font-mono" fontSize="9" letterSpacing="1">2600</text>
      <text x="0" y="136" className="fill-muted-foreground font-mono" fontSize="9" letterSpacing="1">2200</text>
      {/* terrain profile */}
      <polyline
        points="0,175 70,150 130,158 210,108 268,122 340,58 396,74 460,30 560,14"
        stroke="var(--foreground)"
        strokeWidth="1.5"
      />
      {/* the route */}
      <polyline
        points="0,175 130,158 268,122 396,74 460,30"
        stroke="var(--signal)"
        strokeWidth="2"
      />
      {[
        [130, 158],
        [268, 122],
        [396, 74],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3.5" fill="var(--background)" stroke="var(--signal)" strokeWidth="2" />
      ))}
      {/* summit */}
      <circle cx="460" cy="30" r="4.5" fill="var(--signal)" />
      <text x="474" y="34" className="fill-foreground font-mono" fontSize="9.5" letterSpacing="1.5">VALIDATED</text>
    </svg>
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
    <main className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* top strip */}
      <header className="flex h-16 items-center justify-between border-b px-5 sm:px-8">
        <GlaciaNavBrand />
        <span className="type-legend hidden text-muted-foreground sm:block">
          Organization access
        </span>
      </header>

      {/* poster + form */}
      <section className="grid w-full flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(400px,480px)]">
        <div className="relative flex flex-col justify-between overflow-hidden border-b px-5 pt-12 pb-10 sm:px-10 lg:border-r lg:border-b-0 lg:pt-20">
          {/* exposed column grid */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
            <span className="absolute inset-y-0 left-1/4 w-px bg-border" />
            <span className="absolute inset-y-0 left-2/4 w-px bg-border" />
            <span className="absolute inset-y-0 left-3/4 w-px bg-border" />
          </div>

          <div className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <div className="flex items-center gap-3">
              <span className="size-2.5 bg-signal" aria-hidden="true" />
              <p className="type-legend text-muted-foreground">
                Field records / Interviews / Evidence
              </p>
            </div>
            <h1 className="type-poster mt-6 max-w-2xl text-[clamp(44px,7vw,86px)]">
              Customer validation
            </h1>
            <p className="mt-6 max-w-md text-[14.5px] leading-6 text-muted-foreground">
              Log interviews, confirm problems, and track every contact along
              the route from first outreach to validated.
            </p>

            {/* the route: real pipeline stages */}
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
              {STAGES.map((stage, i) => (
                <span key={stage} className="flex items-center gap-3">
                  <span
                    className={
                      "type-legend " +
                      (i === STAGES.length - 1 ? "text-signal" : "text-foreground")
                    }
                  >
                    {stage}
                  </span>
                  {i < STAGES.length - 1 && (
                    <span className="h-px w-6 bg-foreground/40" aria-hidden="true" />
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-14 hidden lg:block">
            <CrossSection />
          </div>
        </div>

        <div className="flex flex-col justify-center bg-secondary px-5 py-12 sm:px-10 lg:py-16">
          <div className="mx-auto w-full max-w-[360px] lg:mx-0">
            <div className="flex items-baseline justify-between border-b border-foreground pb-3">
              <h2 className="text-[24px] font-bold tracking-[-0.015em]">Sign in</h2>
              <span className="type-legend text-muted-foreground">Members</span>
            </div>
            <div className="mt-6">
              <LoginForm
                passwordLoginEnabled={passwordLoginEnabled}
                microsoftEnabled={microsoftEnabled}
                ssoError={ssoError}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ink base bar */}
      <footer className="flex h-12 items-center justify-between bg-foreground px-5 text-background sm:px-8">
        <span className="type-legend">GlaciaNav CRM</span>
        <span className="type-legend">46.5583°N 7.9822°E · 3454 M</span>
      </footer>
    </main>
  );
}
