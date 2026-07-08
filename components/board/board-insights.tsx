"use client";

import type { InsightsData } from "@/lib/board-types";

export function BoardInsights({ insights }: { insights: InsightsData }) {
  const maxNeed = Math.max(1, ...insights.needs.map((n) => n.count));
  const maxWeek = Math.max(1, ...insights.weekly.map((w) => w.count));
  const funnelTotal = Math.max(
    1,
    insights.funnel.reduce((a, b) => a + b.count, 0)
  );
  const maxOwner = Math.max(1, ...insights.owners.map((o) => o.count));
  const problemTotal = Math.max(
    1,
    insights.problems.reduce((a, b) => a + b.count, 0)
  );

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2">
        <Card
          title="Needs leaderboard"
          subtitle="Which problems repeat across interviews. This ranking is the build queue."
        >
          {insights.needs.length === 0 && <Empty text="Tag needs on contacts to rank them." />}
          <div className="space-y-2">
            {insights.needs.slice(0, 8).map((need, i) => (
              <div key={need.name} className="flex items-center gap-3">
                <span className="w-5 text-[12px] font-bold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {need.name}
                    </span>
                    <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
                      {need.count}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary">
                    <div
                      className="h-2 bg-foreground"
                      style={{ width: `${(need.count / maxNeed) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Stage funnel" subtitle="Where contacts sit in the validation pipeline.">
          <div className="mb-4 flex h-3 overflow-hidden">
            {insights.funnel
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.label}
                  style={{
                    width: `${(s.count / funnelTotal) * 100}%`,
                    backgroundColor: s.color,
                  }}
                  title={`${s.label}: ${s.count}`}
                />
              ))}
          </div>
          <div className="space-y-1.5">
            {insights.funnel.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <span className="size-2.5" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-[13px] text-foreground">{s.label}</span>
                <span className="text-[13px] font-semibold tabular-nums text-foreground">
                  {s.count}
                </span>
                <span className="w-10 text-right text-[12px] tabular-nums text-muted-foreground">
                  {Math.round((s.count / funnelTotal) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Interviews per week"
          subtitle="Pace against the 10 to 20 interviews per segment target."
        >
          <div className="flex h-36 items-end gap-2">
            {insights.weekly.map((week) => (
              <div key={week.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {week.count > 0 ? week.count : ""}
                </span>
                <div
                  className="w-full bg-[var(--chart-2)]"
                  style={{
                    height: `${Math.max(week.count > 0 ? 8 : 2, (week.count / maxWeek) * 100)}px`,
                  }}
                />
                <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                  {week.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Problem confirmation"
          subtitle="Evidence quality: how the audience responded when asked."
        >
          <div className="mb-4 flex h-3 overflow-hidden">
            {insights.problems
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.label}
                  style={{
                    width: `${(s.count / problemTotal) * 100}%`,
                    backgroundColor: s.color,
                  }}
                  title={`${s.label}: ${s.count}`}
                />
              ))}
          </div>
          <div className="space-y-1.5">
            {insights.problems.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <span className="size-2.5" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-[13px] text-foreground">{s.label}</span>
                <span className="text-[13px] font-semibold tabular-nums text-foreground">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-[12px] leading-relaxed text-muted-foreground">
            Keep building when most assessed contacts confirm the problem and current solutions
            fall short.
          </p>
        </Card>

        <Card title="Lead workload" subtitle="Contacts per team member.">
          <div className="space-y-2.5">
            {insights.owners.map((owner) => (
              <div key={owner.name} className="flex items-center gap-3">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: owner.color }}
                >
                  {owner.name[0]}
                </span>
                <span className="w-24 truncate text-[13px] text-foreground">{owner.name}</span>
                <div className="h-2 flex-1 bg-secondary">
                  <div
                    className="h-2"
                    style={{
                      width: `${(owner.count / maxOwner) * 100}%`,
                      backgroundColor: owner.color,
                    }}
                  />
                </div>
                <span className="w-6 text-right text-[13px] font-semibold tabular-nums text-foreground">
                  {owner.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border">
      <div className="border-b border-border bg-secondary px-4 py-2.5">
        <h2 className="type-legend text-foreground">{title}</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-[12.5px] text-muted-foreground">{text}</p>;
}
