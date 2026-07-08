import Link from "next/link";
import { Plus, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import { NewContactDialog } from "@/components/shell/new-contact-dialog";
import { SidebarNav, BottomLinks } from "@/components/shell/sidebar-nav";
import { BergMark } from "@/components/shell/top-nav";

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
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/70 bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_42%,#eef3f8_100%)] shadow-[12px_0_38px_rgba(36,52,77,0.08)]">
      <div className="p-3 pb-0">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/82 px-3 py-3 shadow-[0_14px_34px_rgba(36,52,77,0.10)] backdrop-blur">
          <BergMark className="size-9 rounded-[13px]" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {board?.name ?? "Customer Validation"}
            </p>
            <p className="text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
              Validation workspace
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 pt-4">
        <SidebarNav taskCount={taskCount} />
      </div>

      <div className="mt-6 flex-1 px-3">
        <p className="px-2.5 pb-2 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Up next
        </p>
        <div className="space-y-1">
          {upcoming.map((c) => (
            <Link
              key={c.id}
              href="/tasks"
              className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/72 px-2.5 py-1.5 shadow-sm transition-colors hover:border-ring/40 hover:bg-white"
            >
              <span
                className="flex h-8 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-muted"
                style={{ boxShadow: `inset 0 2px 0 ${c.group.color}` }}
              >
                <span className="font-mono text-[12px] leading-none font-semibold text-foreground">
                  {c.interviewDate!.getDate()}
                </span>
                <span className="text-[8.5px] tracking-wide text-muted-foreground uppercase">
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
            <p className="px-2.5 py-1 text-[12px] text-muted-foreground/70">
              No interviews scheduled.
            </p>
          )}
        </div>
      </div>

      <div className="px-3 pb-1">
        <BottomLinks isAdmin={isAdmin} />
      </div>

      <div className="p-3">
        <NewContactDialog
          groups={groups}
          trigger={
            <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-deep px-3 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(9,20,38,0.20)] transition-colors hover:bg-[#1e293b]">
              <Plus className="size-4" strokeWidth={2.5} />
              New contact
            </button>
          }
        />
      </div>
    </aside>
  );
}
