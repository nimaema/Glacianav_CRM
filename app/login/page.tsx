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

/* Swisstopo-style cross-section: hairline elevation grid, ink profile,
   red route to the summit. Decorative — foreshadows the dashboard Ascent. */
function CrossSection() {
  return (
    <svg
      viewBox="0 0 560 150"
      className="w-full"
      aria-hidden="true"
      fill="none"
    >
      {/* elevation grid */}
      {[20, 55, 90, 125].map((y) => (
        <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--border)" strokeWidth="1" />
      ))}
      <text x="0" y="16" className="fill-muted-foreground font-mono" fontSize="9" letterSpacing="1">3400</text>
      <text x="0" y="51" className="fill-muted-foreground font-mono" fontSize="9" letterSpacing="1">3000</text>
      <text x="0" y="86" className="fill-muted-foreground font-mono" fontSize="9" letterSpacing="1">2600</text>
      {/* terrain profile */}
      <polyline
        points="0,138 70,118 130,124 210,84 268,96 340,44 396,58 460,22 560,10"
        stroke="var(--foreground)"
        strokeWidth="1.5"
      />
      {/* the route */}
      <polyline
        points="0,138 130,124 268,96 396,58 460,22"
        stroke="var(--signal)"
        strokeWidth="2"
      />
      {[
        [130, 124],
        [268, 96],
        [396, 58],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3" fill="var(--background)" stroke="var(--signal)" strokeWidth="2" />
      ))}
      {/* summit */}
      <circle cx="460" cy="22" r="4" fill="var(--signal)" />
      <text x="472" y="26" className="fill-foreground font-mono" fontSize="9" letterSpacing="1">VALIDATED</text>
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
      <section className="mx-auto grid w-full max-w-6xl flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(400px,440px)]">
        <div className="flex flex-col justify-between border-b px-5 pt-10 pb-8 sm:px-8 lg:border-r lg:border-b-0 lg:pt-16">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <div className="flex items-center gap-3">
              <span className="size-2.5 bg-signal" aria-hidden="true" />
              <p className="type-legend text-muted-foreground">
                Field records / Interviews / Evidence
              </p>
            </div>
            <h1 className="type-poster mt-5 max-w-xl text-[clamp(38px,5.5vw,64px)]">
              Customer validation
            </h1>
            <p className="mt-5 max-w-md text-[14px] leading-6 text-muted-foreground">
              Log interviews, confirm problems, and track every contact along
              the route from first outreach to validated.
            </p>
          </div>

          <div className="mt-12 hidden lg:block">
            <CrossSection />
          </div>
        </div>

        <div className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:py-16">
          <div className="mx-auto w-full max-w-[360px] lg:mx-0">
            <div className="flex items-baseline justify-between border-b border-foreground pb-3">
              <h2 className="text-[22px] font-bold tracking-[-0.015em]">Sign in</h2>
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

      {/* base rule */}
      <footer className="flex h-12 items-center justify-between border-t px-5 sm:px-8">
        <span className="type-legend text-muted-foreground">GlaciaNav CRM</span>
        <span className="type-legend text-muted-foreground">
          46.5583°N 7.9822°E · 3454 M
        </span>
      </footer>
    </main>
  );
}
