import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  BellRing,
  Flame,
  MessagesSquare,
  Sparkles,
  UserRound,
} from "lucide-react";
import { chipTint } from "@/lib/board-types";
import { prisma } from "@/lib/prisma";

const TERMINAL_STAGES = ["Validated", "Not a Fit", "Not Contacted"];

export async function MemberDashboard({ userId, name }: { userId: string; name: string }) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const staleCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const mine = { ownerId: userId };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [myContacts, myNotes, myConfirmed, myAssessed, upcoming, followupList, staleList] =
    await Promise.all([
      prisma.contact.count({ where: mine }),
      prisma.validationNote.count({ where: { contact: mine } }),
      prisma.contact.count({ where: { ...mine, problem: { label: "Confirmed" } } }),
      prisma.contact.count({ where: { ...mine, problem: { label: { not: "Not asked" } } } }),
      prisma.contact.findMany({
        where: { ...mine, interviewDate: { gte: startOfToday } },
        orderBy: { interviewDate: "asc" },
        take: 6,
        include: { group: { select: { color: true, name: true } } },
      }),
      prisma.contact.findMany({
        where: { ...mine, followup: { label: { not: "No follow-up" } } },
        orderBy: { updatedAt: "asc" },
        take: 6,
        include: { followup: true, group: { select: { color: true } } },
      }),
      prisma.contact.findMany({
        where: { ...mine, updatedAt: { lt: staleCutoff }, stage: { label: { notIn: TERMINAL_STAGES } } },
        orderBy: { updatedAt: "asc" },
        take: 6,
        include: { stage: true, group: { select: { color: true } } },
      }),
    ]);

  const problemPct = myAssessed ? Math.round((myConfirmed / myAssessed) * 100) : 0;

  const metrics = [
    { label: "My contacts", value: String(myContacts), icon: UserRound },
    { label: "Interviews I logged", value: String(myNotes), icon: MessagesSquare },
    { label: "Problem confirmed", value: `${problemPct}%`, icon: Sparkles },
    { label: "My follow-ups", value: String(followupList.length), icon: BellRing },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              {greeting}, {name.split(" ")[0]}
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              Your assigned contacts and what needs a touch today.
            </p>
          </div>
          <Link
            href="/tasks"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#0043b0]"
          >
            My tasks
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
          <Card title="My interviews" icon={<CalendarClock className="size-4 text-primary" strokeWidth={2} />}>
            {upcoming.length === 0 && <Empty text="Nothing scheduled. Book one from the board." />}
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
                <Body title={c.name} sub={c.company ?? c.group.name} />
              </Row>
            ))}
          </Card>

          <Card title="My follow-ups" icon={<BellRing className="size-4 text-blue-600" strokeWidth={2} />}>
            {followupList.length === 0 && <Empty text="No open follow-ups. Clean slate." />}
            {followupList.map((c) => (
              <Row key={c.id} color={c.group.color}>
                <span
                  className="inline-flex h-[20px] shrink-0 items-center rounded-md border px-2 text-[11px] font-semibold"
                  style={chipTint(c.followup!.color)}
                >
                  {c.followup!.label}
                </span>
                <Body title={c.name} sub={c.nextStep ?? "Follow-up open"} />
              </Row>
            ))}
          </Card>

          <Card title="Going cold" icon={<Flame className="size-4 text-orange-600" strokeWidth={2} />}>
            {staleList.length === 0 && <Empty text="Nothing of yours has gone cold." />}
            {staleList.map((c) => (
              <Row key={c.id} color={c.group.color}>
                <span
                  className="inline-flex h-[20px] shrink-0 items-center rounded-md border px-2 text-[11px] font-semibold"
                  style={chipTint(c.stage!.color)}
                >
                  {c.stage!.label}
                </span>
                <Body
                  title={c.name}
                  sub={`No activity for ${Math.floor((Date.now() - c.updatedAt.getTime()) / 86400000)} days`}
                />
              </Row>
            ))}
          </Card>

          <Card title="Focus" icon={<Sparkles className="size-4 text-primary" strokeWidth={2} />}>
            <p className="px-1 py-1 text-[12.5px] leading-relaxed text-muted-foreground">
              You lead <span className="font-semibold text-foreground">{myContacts}</span> contacts and
              have logged <span className="font-semibold text-foreground">{myNotes}</span> interviews.
              {problemPct >= 50
                ? " Strong signal so far — keep confirming the problem."
                : " Keep interviewing to confirm the problem before building."}
            </p>
          </Card>
        </div>
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
      className="group relative flex items-center gap-3 rounded-md py-1.5 pr-2 pl-3 transition-colors hover:bg-muted"
    >
      <span className="absolute inset-y-1 left-0 w-[3px] rounded-full" style={{ backgroundColor: color }} />
      {children}
      <ArrowRight className="size-4 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" strokeWidth={2} />
    </Link>
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

function Empty({ text }: { text: string }) {
  return <p className="py-1 text-[12.5px] text-muted-foreground">{text}</p>;
}
