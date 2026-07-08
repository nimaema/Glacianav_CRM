import Link from "next/link";
import { Plus, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import { NewContactDialog } from "@/components/shell/new-contact-dialog";
import { SidebarNav, BottomLinks } from "@/components/shell/sidebar-nav";
import { GlaciaNavMark } from "@/components/brand/glacianav-brand";

const TERMINAL = ["Validated", "Not a Fit", "Not Contacted"];

export async function AppSidebar({ session }: { session: SessionUser }) {
  const isAdmin = session.role === "ADMIN";
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const staleCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [groups, board, upcoming, followupsOpen, staleCount] = await Promise.all([
    prisma.group.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.board.findFirst({ select: { name: true } }),
    prisma.contact.findMany({
      where: { interviewDate: { gte: startOfToday } },
      orderBy: { interviewDate: "asc" },
      take: 3,
      select: { id: true, name: true, interviewDate: true, group: { select: { color: true } } },
    }),
    prisma.contact.count({ where: { followup: { label: { not: "No follow-up" } } } }),
    prisma.contact.count({
      where: { updatedAt: { lt: staleCutoff }, stage: { label: { notIn: TERMINAL } } },
    }),
  ]);

  const taskCount = followupsOpen + staleCount + upcoming.length;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar">
      {/* workspace block: ink, like the poster's imprint */}
      <div className="flex items-center gap-2.5 bg-foreground px-4 py-3.5 text-background">
        <GlaciaNavMark tone="light" className="size-9" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold tracking-tight">
            {board?.name ?? "Customer Validation"}
          </p>
          <p className="type-legend text-background/60">Validation workspace</p>
        </div>
      </div>

      <div className="pt-4">
        <SidebarNav taskCount={taskCount} />
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
        <p className="type-legend px-3 pb-1.5 text-muted-foreground">Up next</p>
        <div>
          {upcoming.map((c) => (
            <Link
              key={c.id}
              href="/tasks"
              className="group relative flex items-center gap-2.5 border-t px-3 py-2 transition-colors duration-150 last:border-b hover:bg-secondary"
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px] scale-y-0 bg-signal transition-transform duration-150 group-hover:scale-y-100"
                aria-hidden="true"
              />
              <span
                className="flex h-9 w-10 shrink-0 flex-col items-center justify-center border bg-background"
                style={{ boxShadow: `inset 0 2px 0 ${c.group.color}` }}
              >
                <span className="font-mono text-[12px] leading-none font-semibold text-foreground">
                  {c.interviewDate!.getDate()}
                </span>
                <span className="type-legend text-muted-foreground">
                  {c.interviewDate!.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-foreground">{c.name}</p>
                <p className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                  <CalendarClock className="size-3" strokeWidth={2} />
                  Interview
                </p>
              </div>
            </Link>
          ))}
          {upcoming.length === 0 && (
            <p className="px-3 py-1 text-[12px] text-muted-foreground/70">
              No interviews scheduled.
            </p>
          )}
        </div>
      </div>

      <div className="pb-1">
        <BottomLinks isAdmin={isAdmin} />
      </div>

      <NewContactDialog
        groups={groups}
        trigger={
          <button className="flex h-11 w-full items-center justify-center gap-1.5 bg-foreground text-[13px] font-semibold text-background transition-colors duration-150 hover:bg-signal">
            <Plus className="size-4" strokeWidth={2.5} />
            New contact
          </button>
        }
      />
    </aside>
  );
}
