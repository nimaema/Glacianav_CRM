import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { chipTint, initials } from "@/lib/board-types";
import { StatNumber } from "@/components/dashboard/stat-number";
import { AscentChart } from "@/components/dashboard/ascent";

const TERMINAL_STAGES = ["Validated", "Not a Fit", "Not Contacted"];

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export async function AdminDashboard({ name }: { name: string }) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const staleCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [
    contactCount,
    noteCount,
    assessed,
    confirmed,
    followupsOpen,
    stages,
    upcoming,
    followupList,
    staleList,
    topTags,
    recentActivity,
    team,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.validationNote.count(),
    prisma.contact.count({ where: { problem: { label: { not: "Not asked" } } } }),
    prisma.contact.count({ where: { problem: { label: "Confirmed" } } }),
    prisma.contact.count({ where: { followup: { label: { not: "No follow-up" } } } }),
    prisma.status.findMany({
      where: { column: "STAGE" },
      orderBy: { position: "asc" },
      select: {
        id: true,
        label: true,
        stageContacts: {
          orderBy: { position: "asc" },
          select: { id: true, name: true, company: true },
        },
      },
    }),
    prisma.contact.findMany({
      where: { interviewDate: { gte: startOfToday } },
      orderBy: { interviewDate: "asc" },
      take: 5,
      include: { group: { select: { name: true, color: true } } },
    }),
    prisma.contact.findMany({
      where: { followup: { label: { not: "No follow-up" } } },
      orderBy: { updatedAt: "asc" },
      take: 5,
      include: { followup: true, group: { select: { color: true } } },
    }),
    prisma.contact.findMany({
      where: {
        updatedAt: { lt: staleCutoff },
        stage: { label: { notIn: TERMINAL_STAGES } },
      },
      orderBy: { updatedAt: "asc" },
      take: 5,
      include: { stage: true, group: { select: { color: true } } },
    }),
    prisma.tag.findMany({
      include: { _count: { select: { contacts: true } } },
      orderBy: { contacts: { _count: "desc" } },
      take: 5,
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        contact: { select: { name: true } },
        user: { select: { name: true, color: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
        role: true,
        _count: { select: { contacts: true } },
      },
    }),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const problemPct = assessed ? Math.round((confirmed / assessed) * 100) : 0;
  const maxTag = Math.max(1, ...topTags.map((t) => t._count.contacts));
  const dateLine = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const metrics: { label: string; value: number; suffix?: string }[] = [
    { label: "Contacts", value: contactCount },
    { label: "Interviews logged", value: noteCount },
    { label: "Problem confirmed", value: problemPct, suffix: "%" },
    { label: "Follow-ups open", value: followupsOpen },
  ];

  const ascentStages = stages.map((s) => ({
    id: s.id,
    label: s.label,
    contacts: s.stageContacts,
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {/* poster header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <div className="flex items-center gap-3">
              <span className="size-2.5 bg-signal" aria-hidden="true" />
              <p className="type-legend text-muted-foreground">
                {dateLine} / {contactCount} contacts / {noteCount} interviews
              </p>
            </div>
            <h1 className="type-poster mt-3 text-[clamp(34px,4.5vw,54px)]">
              {greeting}, {name.split(" ")[0]}.
            </h1>
          </div>
          <Link
            href="/board"
            className="flex h-10 shrink-0 items-center gap-1.5 bg-foreground px-4 text-[13.5px] font-semibold text-background transition-colors duration-150 hover:bg-signal"
          >
            Open board
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </Link>
        </div>

        {/* ruled stat strip */}
        <div className="mt-8 grid grid-cols-2 gap-px border bg-border lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-background px-5 py-4">
              <p className="type-legend text-muted-foreground">{m.label}</p>
              <p className="mt-1.5 text-[36px] leading-none font-bold tracking-tight tabular-nums">
                <StatNumber value={m.value} suffix={m.suffix ?? ""} />
              </p>
            </div>
          ))}
        </div>

        {/* the Ascent */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between border-b border-foreground pb-2.5">
            <h2 className="text-[22px] font-bold tracking-[-0.015em]">The ascent</h2>
            <p className="type-legend text-muted-foreground">
              {stages.length} stages / route to validated
            </p>
          </div>
          <div className="border border-t-0 px-4 pt-6 pb-2">
            <AscentChart stages={ascentStages} />
          </div>
        </section>

        {/* work queues */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Upcoming interviews" count={upcoming.length}>
            {upcoming.length === 0 && (
              <Empty text="Nothing scheduled. Book the next interview from the board." />
            )}
            {upcoming.map((c) => (
              <Row key={c.id}>
                <span className="flex h-9 w-10 shrink-0 flex-col items-center justify-center border bg-background">
                  <span className="font-mono text-[12px] leading-none font-semibold tabular-nums">
                    {c.interviewDate!.getDate()}
                  </span>
                  <span className="type-legend text-muted-foreground">
                    {c.interviewDate!.toLocaleDateString("en-GB", { month: "short" })}
                  </span>
                </span>
                <Body title={c.name} sub={c.company ?? c.group.name} />
              </Row>
            ))}
          </Section>

          <Section title="Follow-ups to do" count={followupList.length}>
            {followupList.length === 0 && <Empty text="No open follow-ups. Clean slate." />}
            {followupList.map((c) => (
              <Row key={c.id}>
                <span
                  className="inline-flex h-5 shrink-0 items-center border px-2 text-[11px] font-semibold"
                  style={chipTint(c.followup!.color)}
                >
                  {c.followup!.label}
                </span>
                <Body title={c.name} sub={c.nextStep ?? "Follow-up open"} />
              </Row>
            ))}
          </Section>

          <Section title="Going cold" count={staleList.length}>
            {staleList.length === 0 && (
              <Empty text="No contact has been sitting untouched. Keep it up." />
            )}
            {staleList.map((c) => (
              <Row key={c.id}>
                <span
                  className="inline-flex h-5 shrink-0 items-center border px-2 text-[11px] font-semibold"
                  style={chipTint(c.stage!.color)}
                >
                  {c.stage!.label}
                </span>
                <Body
                  title={c.name}
                  sub={`No activity for ${Math.floor(
                    (Date.now() - c.updatedAt.getTime()) / 86400000
                  )} days`}
                />
              </Row>
            ))}
          </Section>

          <Section title="Top needs" count={topTags.length}>
            {topTags.length === 0 && <Empty text="Tag needs on contacts to see patterns." />}
            <div className="space-y-3 px-4 py-3">
              {topTags.map((tag) => (
                <div key={tag.id}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-[13px] font-medium">{tag.name}</span>
                    <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                      {tag._count.contacts}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary">
                    <div
                      className="h-2 bg-[var(--chart-2)]"
                      style={{ width: `${(tag._count.contacts / maxTag) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* team + activity */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Team workload" count={team.length}>
            {team.map((u) => (
              <div key={u.id} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-0">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: u.color }}
                >
                  {initials(u.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{u.name}</p>
                  <p className="type-legend text-muted-foreground">
                    {u.role === "ADMIN" ? "Admin" : "Member"}
                  </p>
                </div>
                <span className="font-mono text-[14px] font-semibold tabular-nums">
                  {u._count.contacts}
                </span>
                <span className="text-[11px] text-muted-foreground">leading</span>
              </div>
            ))}
          </Section>

          <Section title="Recent activity" count={recentActivity.length}>
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border-b px-4 py-2 last:border-0">
                {a.user ? (
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: a.user.color }}
                  >
                    {initials(a.user.name)}
                  </span>
                ) : (
                  <span className="flex size-6 shrink-0 items-center justify-center border bg-secondary">
                    <Plus className="size-3 text-muted-foreground" />
                  </span>
                )}
                <p className="min-w-0 flex-1 truncate text-[13px]">
                  <span className="font-medium">{a.contact.name}</span>
                  <span className="text-muted-foreground"> · {a.detail}</span>
                </p>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {timeAgo(a.createdAt)}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && <Empty text="No activity yet." />}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border">
      <div className="flex items-baseline justify-between border-b bg-secondary px-4 py-2.5">
        <h2 className="type-legend text-foreground">{title}</h2>
        {count !== undefined && (
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{count}</span>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/board"
      className="group relative flex items-center gap-3 border-b px-4 py-2.5 transition-colors duration-150 last:border-0 hover:bg-secondary"
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px] scale-y-0 bg-signal transition-transform duration-150 group-hover:scale-y-100"
        aria-hidden="true"
      />
      {children}
      <ArrowRight
        className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        strokeWidth={2}
      />
    </Link>
  );
}

function Body({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[13px] font-medium">{title}</p>
      <p className="truncate text-[11.5px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-3 text-[12.5px] text-muted-foreground">{text}</p>;
}
