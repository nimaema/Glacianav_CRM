import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/board-types";
import type { SessionUser } from "@/lib/session";
import { AccountMenu } from "@/components/shell/sidebar-nav";
import { GlobalBell, GlobalSearch, type BellItem } from "@/components/shell/top-nav-client";
import { GlaciaNavMark } from "@/components/brand/glacianav-brand";

const TERMINAL = ["Validated", "Not a Fit", "Not Contacted"];

export function BergMark({ className = "size-6" }: { className?: string }) {
  return <GlaciaNavMark className={className} />;
}

export async function TopNav({ session }: { session: SessionUser }) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 24 * 3600 * 1000);

  const [interviewsToday, followups, staleCandidates] = await Promise.all([
    prisma.contact.findMany({
      where: { interviewDate: { gte: startOfToday, lt: endOfToday } },
      select: { id: true, name: true, company: true },
    }),
    prisma.contact.findMany({
      where: { followup: { label: { not: "No follow-up" } } },
      select: { id: true, name: true, nextStep: true, followup: { select: { label: true } } },
    }),
    prisma.contact.findMany({
      where: { stage: { label: { notIn: TERMINAL } } },
      select: { id: true, name: true, updatedAt: true, stage: { select: { label: true } } },
    }),
  ]);

  const items: BellItem[] = [
    ...interviewsToday.map((c) => ({
      id: `int-${c.id}`,
      kind: "interview" as const,
      text: `Interview with ${c.name} today`,
      sub: c.company ?? "Scheduled today",
    })),
    ...followups.map((c) => ({
      id: `fu-${c.id}`,
      kind: "followup" as const,
      text: `${c.followup!.label}: ${c.name}`,
      sub: c.nextStep ?? "Follow-up open",
    })),
    ...staleCandidates.map((c) => ({
      id: `stale-${c.id}`,
      kind: "stale" as const,
      text: `${c.name} is going cold`,
      sub: `Sitting in ${c.stage!.label} untouched`,
      updatedAt: c.updatedAt.toISOString(),
    })),
  ];

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/70 bg-white/82 pr-4 pl-5 shadow-[0_12px_34px_rgba(36,52,77,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/70 py-1 pr-3 pl-1.5 shadow-sm">
        <BergMark className="size-8 rounded-[11px]" />
        <span className="text-[14.5px] font-bold tracking-tight text-foreground">
          GlaciaNav <span className="font-semibold text-muted-foreground">CRM</span>
        </span>
      </div>

      <span className="flex-1" />

      <GlobalSearch />
      <GlobalBell items={items} />
      <AccountMenu
        name={session.name}
        role={session.role}
        color={session.color}
        initials={initials(session.name)}
      />
    </header>
  );
}
