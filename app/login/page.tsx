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

/* Compact Swiss-poster massif: flat tonal peaks on a baseline rule, one red
   switchback route to the summit. The full data-bound cross-section lives on
   the dashboard as the Ascent. */
function Massif() {
  return (
    <svg
      viewBox="0 0 560 104"
      className="w-full max-w-lg"
      aria-hidden="true"
      fill="none"
    >
      {/* flanking peaks: tonal greys */}
      <path d="M0,96 L104,34 L208,96 Z" fill="var(--foreground)" opacity="0.16" />
      <path d="M242,96 L392,26 L542,96 Z" fill="var(--foreground)" opacity="0.09" />
      {/* main peak: solid ink */}
      <path d="M118,96 L236,10 L354,96 Z" fill="var(--foreground)" />
      {/* switchback route: paper cut through the ink */}
      <polyline
        points="132,90 200,64 182,52 224,34 236,10"
        stroke="var(--background)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* summit marker */}
      <circle cx="236" cy="10" r="4.5" fill="var(--signal)" />
      {/* baseline rule */}
      <line x1="0" y1="96" x2="560" y2="96" stroke="var(--foreground)" strokeWidth="1.5" />
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
            <Massif />
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
