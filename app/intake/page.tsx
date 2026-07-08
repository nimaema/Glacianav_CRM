import { prisma } from "@/lib/prisma";
import { IntakeForm } from "@/app/intake/intake-form";
import { GlaciaNavBrand } from "@/components/brand/glacianav-brand";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Get in touch - GlaciaNav",
  description: "Tell us about navigating glaciated terrain and we will reach out.",
};

export default async function IntakePage() {
  const groups = await prisma.group.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b px-5 sm:px-8">
        <GlaciaNavBrand />
        <span className="type-legend hidden text-muted-foreground sm:block">Field survey</span>
      </header>

      <section className="mx-auto w-full max-w-xl flex-1 px-5 py-12 sm:px-0">
        <div className="flex items-center gap-3">
          <span className="size-2.5 bg-signal" aria-hidden="true" />
          <p className="type-legend text-muted-foreground">
            Guides / Operators / Alpinists · 2 minutes
          </p>
        </div>
        <h1 className="type-poster mt-4 text-[clamp(30px,5vw,44px)]">
          Help us build for the mountains
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-6 text-muted-foreground">
          We interview guides, operators, and alpinists about navigating glaciated
          terrain. Leave your details and we will reach out.
        </p>

        <div className="mt-8 border bg-card p-6">
          <IntakeForm groups={groups} />
        </div>
      </section>

      <footer className="flex h-12 items-center justify-between bg-foreground px-5 text-background sm:px-8">
        <span className="type-legend">GlaciaNav</span>
        <span className="type-legend">46.5583°N 7.9822°E · 3454 M</span>
      </footer>
    </main>
  );
}
