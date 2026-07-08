import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { chipTint } from "@/lib/board-types";
import { prisma } from "@/lib/prisma";
import { StatNumber } from "@/components/dashboard/stat-number";
import { AscentChart } from "@/components/dashboard/ascent";

const TERMINAL_STAGES = ["Validated", "Not a Fit", "Not Contacted"];

export async function MemberDashboard({ userId, name }: { userId: string; name: string }) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const staleCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const mine = { ownerId: userId };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [myContacts, myNotes, myConfirmed, myAssessed, stages, upcoming, followupList, staleList] =
    await Promise.all([
      prisma.contact.count({ where: mine }),
      prisma.validationNote.count({ where: { contact: mine } }),
      prisma.contact.count({ where: { ...mine, problem: { label: "Confirmed" } } }),
      prisma.contact.count({ where: { ...mine, problem: { label: { not: "Not asked" } } } }),
      prisma.status.findMany({
        where: { column: "STAGE" },
        orderBy: { position: "asc" },
        select: {
          id: true,
          label: true,
          stageContacts: {
            where: mine,
            orderBy: { position: "asc" },
            select: { id: true, name: true, company: true },
          },
        },
      }),
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
        where: {
          ...mine,
          updatedAt: { lt: staleCutoff },
          stage: { label: { notIn: TERMINAL_STAGES } },
        },
        orderBy: { updatedAt: "asc" },
        take: 6,
        include: { stage: true, group: { select: { color: true } } },
      }),
    ]);

  const problemPct = myAssessed ? Math.round((myConfirmed / myAssessed) * 100) : 0;
  const dateLine = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const metrics: { label: string; value: number; suffix?: string }[] = [
    { label: "My contacts", value: myContacts },
    { label: "Interviews I logged", value: myNotes },
    { label: "Problem confirmed", value: problemPct, suffix: "%" },
    { label: "My follow-ups", value: followupList.length },
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
                {dateLine} / your assigned contacts
              </p>
            </div>
            <h1 className="type-poster mt-3 text-[clamp(34px,4.5vw,54px)]">
              {greeting}, {name.split(" ")[0]}.
            </h1>
          </div>
          <Link
            href="/tasks"
            className="flex h-10 shrink-0 items-center gap-1.5 bg-foreground px-4 text-[13.5px] font-semibold text-background transition-colors duration-150 hover:bg-signal"
          >
            My tasks
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

        {/* my route */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between border-b border-foreground pb-2.5">
            <h2 className="text-[22px] font-bold tracking-[-0.015em]">My route</h2>
            <p className="type-legend text-muted-foreground">
              {myContacts} contacts on the mountain
            </p>
          </div>
          <div className="border border-t-0 px-4 pt-6 pb-2">
            <AscentChart stages={ascentStages} />
          </div>
        </section>

        {/* my queues */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="My interviews" count={upcoming.length}>
            {upcoming.length === 0 && <Empty text="Nothing scheduled. Book one from the board." />}
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

          <Section title="My follow-ups" count={followupList.length}>
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
            {staleList.length === 0 && <Empty text="Nothing of yours has gone cold." />}
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

          <Section title="Focus">
            <p className="px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
              You lead <span className="font-semibold text-foreground">{myContacts}</span> contacts
              and have logged <span className="font-semibold text-foreground">{myNotes}</span>{" "}
              interviews.
              {problemPct >= 50
                ? " Strong signal so far. Keep confirming the problem."
                : " Keep interviewing to confirm the problem before building."}
            </p>
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
