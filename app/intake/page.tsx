import { prisma } from "@/lib/prisma";
import { IntakeForm } from "@/app/intake/intake-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "GlaciaNav — get in touch",
  description: "Tell us about navigating glaciated terrain and we will reach out.",
};

export default async function IntakePage() {
  const groups = await prisma.group.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex min-h-full items-center justify-center bg-brand-deep px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
            <path d="M12 2 L22 20 H2 Z" fill="#6ea0ff" />
            <path d="M12 2 L22 20 H12 Z" fill="#316bf3" />
          </svg>
          <span className="text-[17px] font-bold tracking-tight text-white">GlaciaNav</span>
        </div>
        <div className="rounded-xl bg-background p-6 shadow-xl">
          <h1 className="text-[19px] font-bold tracking-tight text-foreground">
            Help us build for the mountains
          </h1>
          <p className="mt-1 mb-5 text-[13px] leading-relaxed text-muted-foreground">
            We interview guides, operators, and alpinists about navigating glaciated terrain.
            Leave your details and we will reach out.
          </p>
          <IntakeForm groups={groups} />
        </div>
      </div>
    </div>
  );
}
