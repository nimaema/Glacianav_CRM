import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  BellRing,
  Flame,
  TrendingUp,
  MessagesSquare,
  Plus,
  Pencil,
  Sparkles,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { chipTint, initials } from "@/lib/board-types";


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
      select: { id: true, name: true, color: true, role: true, _count: { select: { contacts: true } } },
    }),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const problemPct = assessed ? Math.round((confirmed / assessed) * 100) : 0;
  const maxTag = Math.max(1, ...topTags.map((t) => t._count.contacts));

  const metrics = [
    { label: "Contacts", value: String(contactCount), icon: TrendingUp },
    { label: "Interviews logged", value: String(noteCount), icon: MessagesSquare },
    { label: "Problem confirmed", value: `${problemPct}%`, icon: Sparkles },
    { label: "Follow-ups open", value: String(followupsOpen), icon: BellRing },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              {greeting}, {name.split(" ")[0]}
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              . Here is where your validation stands.
            </p>
          </div>
          <Link
            href="/board"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#0043b0]"
          >
            Open board
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-border px-4 py-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <m.icon className="size-3.5" strokeWidth={2} />
                <span className="text-[11.5px] font-medium">{m.label}</span>
              </div>
              <p className="mt-1 text-[22px] font-bold tracking-tight tabular-nums text-foreground">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Upcoming interviews" icon={<CalendarClock className="size-4 text-primary" strokeWidth={2} />}>
            {upcoming.length === 0 && (
              <Empty text="Nothing scheduled. Book the next interview from the board." />
            )}
            {upcoming.map((c) => (
              <Row key={c.id} color={c.group.color}>
                <span className="flex h-9 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-muted">
                  <span className="text-[13px] leading-none font-bold tabular-nums">
                    {c.interviewDate!.getDate()}
                  </span>
                  <span className="text-[9px] tracking-wide text-muted-foreground uppercase">
                    {c.interviewDate!.toLocaleDateString("en-GB", { month: "short" })}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">{c.name}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {c.company ?? c.group.name}
                  </p>
                </div>
              </Row>
            ))}
          </Card>

          <Card title="Follow-ups to do" icon={<BellRing className="size-4 text-blue-600" strokeWidth={2} />}>
            {followupList.length === 0 && <Empty text="No open follow-ups. Clean slate." />}
            {followupList.map((c) => (
              <Row key={c.id} color={c.group.color}>
                <span
                  className="inline-flex h-[20px] shrink-0 items-center rounded-md border px-2 text-[11px] font-semibold"
                  style={chipTint(c.followup!.color)}
                >
                  {c.followup!.label}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">{c.name}</p>
                  {c.nextStep && (
                    <p className="truncate text-[11.5px] text-muted-foreground">{c.nextStep}</p>
                  )}
                </div>
              </Row>
            ))}
          </Card>

          <Card title="Going cold" icon={<Flame className="size-4 text-orange-600" strokeWidth={2} />}>
            {staleList.length === 0 && (
              <Empty text="No contact has been sitting untouched. Keep it up." />
            )}
            {staleList.map((c) => (
              <Row key={c.id} color={c.group.color}>
                <span
                  className="inline-flex h-[20px] shrink-0 items-center rounded-md border px-2 text-[11px] font-semibold"
                  style={chipTint(c.stage!.color)}
                >
                  {c.stage!.label}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">{c.name}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    No activity for {Math.floor((Date.now() - c.updatedAt.getTime()) / 86400000)}{" "}
                    days
                  </p>
                </div>
              </Row>
            ))}
          </Card>

          <Card title="Top needs" icon={<TrendingUp className="size-4 text-primary" strokeWidth={2} />}>
            {topTags.length === 0 && <Empty text="Tag needs on contacts to see patterns." />}
            <div className="space-y-2.5 pt-1">
              {topTags.map((tag) => (
                <div key={tag.id}>
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <span className="text-[13px] font-medium text-foreground">{tag.name}</span>
                    <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
                      {tag._count.contacts}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(tag._count.contacts / maxTag) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <section className="mt-5 rounded-lg border border-border p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <Users className="size-4 text-primary" strokeWidth={2} />
            <h2 className="text-[13.5px] font-bold tracking-tight text-foreground">
              Team workload
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {team.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: u.color }}
                >
                  {initials(u.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {u.role === "ADMIN" ? "Admin" : "Member"}
                  </p>
                </div>
                <span className="text-[13px] font-bold tabular-nums text-foreground">
                  {u._count.contacts}
                </span>
                <span className="text-[11px] text-muted-foreground">leading</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <Pencil className="size-4 text-muted-foreground" strokeWidth={2} />
            <h2 className="text-[13.5px] font-bold tracking-tight text-foreground">
              Recent activity
            </h2>
          </div>
          <div className="divide-y divide-border/70">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2">
                {a.user ? (
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: a.user.color }}
                  >
                    {initials(a.user.name)}
                  </span>
                ) : (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Plus className="size-3 text-muted-foreground" />
                  </span>
                )}
                <p className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                  <span className="font-medium">{a.contact.name}</span>
                  <span className="text-muted-foreground"> · {a.detail}</span>
                </p>
                <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                  {timeAgo(a.createdAt)}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="px-4 py-3 text-[12.5px] text-muted-foreground">No activity yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border p-4">
      <div className="mb-2.5 flex items-center gap-2">
        {icon}
        <h2 className="text-[13.5px] font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Row({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <Link
      href="/board"
      className="relative flex items-center gap-3 rounded-md py-1.5 pr-2 pl-3 transition-colors hover:bg-muted"
    >
      <span
        className="absolute inset-y-1 left-0 w-[3px] rounded-full"
        style={{ backgroundColor: color }}
      />
      {children}
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-1 text-[12.5px] text-muted-foreground">{text}</p>;
}
