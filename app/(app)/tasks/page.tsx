import Link from "next/link";
import { CalendarClock, BellRing, Flame, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { chipTint, initials } from "@/lib/board-types";

export const dynamic = "force-dynamic";

const TERMINAL = ["Validated", "Not a Fit", "Not Contacted"];

export default async function TasksPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const staleCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [interviews, followups, stale] = await Promise.all([
    prisma.contact.findMany({
      where: { interviewDate: { gte: startOfToday } },
      orderBy: { interviewDate: "asc" },
      include: { group: { select: { color: true, name: true } }, owner: { select: { name: true, color: true } } },
    }),
    prisma.contact.findMany({
      where: { followup: { label: { not: "No follow-up" } } },
      orderBy: { updatedAt: "asc" },
      include: { followup: true, group: { select: { color: true } }, owner: { select: { name: true, color: true } } },
    }),
    prisma.contact.findMany({
      where: { updatedAt: { lt: staleCutoff }, stage: { label: { notIn: TERMINAL } } },
      orderBy: { updatedAt: "asc" },
      include: { stage: true, group: { select: { color: true } } },
    }),
  ]);

  const total = interviews.length + followups.length + stale.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <span className="text-[12.5px] font-medium tabular-nums text-muted-foreground">
            {total} open
          </span>
        </div>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Everything that needs a touch, pulled live from your board.
        </p>

        <Section
          title="Scheduled interviews"
          icon={<CalendarClock className="size-4 text-primary" strokeWidth={2} />}
          count={interviews.length}
          empty="No interviews scheduled."
        >
          {interviews.map((c) => (
            <TaskRow key={c.id} color={c.group.color}>
              <DateChip date={c.interviewDate!} />
              <Body title={c.name} sub={c.company ?? c.group.name} />
              {c.owner && <Owner name={c.owner.name} color={c.owner.color} />}
            </TaskRow>
          ))}
        </Section>

        <Section
          title="Follow-ups to do"
          icon={<BellRing className="size-4 text-blue-600" strokeWidth={2} />}
          count={followups.length}
          empty="No open follow-ups."
        >
          {followups.map((c) => (
            <TaskRow key={c.id} color={c.group.color}>
              <span
                className="inline-flex h-[22px] shrink-0 items-center rounded-md border px-2.5 text-[11px] font-semibold"
                style={chipTint(c.followup!.color)}
              >
                {c.followup!.label}
              </span>
              <Body title={c.name} sub={c.nextStep ?? "Follow-up open"} />
              {c.owner && <Owner name={c.owner.name} color={c.owner.color} />}
            </TaskRow>
          ))}
        </Section>

        <Section
          title="Going cold"
          icon={<Flame className="size-4 text-orange-600" strokeWidth={2} />}
          count={stale.length}
          empty="Nothing has gone cold. Nice."
        >
          {stale.map((c) => (
            <TaskRow key={c.id} color={c.group.color}>
              <span
                className="inline-flex h-[22px] shrink-0 items-center rounded-md border px-2.5 text-[11px] font-semibold"
                style={chipTint(c.stage!.color)}
              >
                {c.stage!.label}
              </span>
              <Body
                title={c.name}
                sub={`No activity for ${Math.floor((Date.now() - c.updatedAt.getTime()) / 86400000)} days`}
              />
            </TaskRow>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h2 className="text-[14px] font-bold tracking-tight text-foreground">{title}</h2>
        <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-[12.5px] text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">{children}</div>
      )}
    </section>
  );
}

function TaskRow({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <Link
      href="/board"
      className="group relative flex items-center gap-3 border-b border-border/60 bg-background px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/50"
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: color }} />
      {children}
      <ArrowRight className="size-4 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" strokeWidth={2} />
    </Link>
  );
}

function DateChip({ date }: { date: Date }) {
  return (
    <span className="flex h-9 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-muted">
      <span className="text-[13px] leading-none font-bold tabular-nums text-foreground">
        {date.getDate()}
      </span>
      <span className="text-[9px] tracking-wide text-muted-foreground uppercase">
        {date.toLocaleDateString("en-GB", { month: "short" })}
      </span>
    </span>
  );
}

function Body({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[13px] font-medium text-foreground">{title}</p>
      <p className="truncate text-[11.5px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Owner({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
