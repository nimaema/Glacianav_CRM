"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { BoardCalendar } from "@/components/board/board-calendar";
import { ContactDrawer } from "@/components/board/contact-drawer";
import { chipTint, type BoardDTO, type ContactDTO } from "@/lib/board-types";

export function CalendarView({ board }: { board: BoardDTO }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const open = (c: ContactDTO) => setSelectedId(c.id);

  const selected = useMemo<ContactDTO | null>(
    () => board.groups.flatMap((g) => g.contacts).find((c) => c.id === selectedId) ?? null,
    [board.groups, selectedId]
  );

  const upcoming = useMemo(() => {
    const todayIso = new Date().toLocaleDateString("sv-SE");
    const groupColor = new Map(board.groups.map((g) => [g.id, g.color]));
    return board.groups
      .flatMap((g) => g.contacts)
      .filter((c) => c.interviewDate && c.interviewDate >= todayIso)
      .sort((a, b) => a.interviewDate!.localeCompare(b.interviewDate!))
      .map((c) => ({ ...c, groupColor: groupColor.get(c.groupId) ?? "#64748b" }));
  }, [board.groups]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border px-8 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="size-2 bg-signal" aria-hidden="true" />
          <span className="type-legend text-muted-foreground">Workspace / interviews</span>
        </div>
        <h1 className="type-poster mt-2 text-[clamp(26px,3vw,36px)] text-foreground">Calendar</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Interviews on the grid, with each contact&apos;s status in the agenda.
        </p>
      </header>

      <div className="flex min-h-0 flex-1">
        <BoardCalendar board={board} onOpenContact={open} />

        <aside className="flex w-80 shrink-0 flex-col border-l border-border">
          <div className="flex items-center gap-2 border-b border-border bg-secondary px-5 py-3">
            <CalendarClock className="size-4 text-foreground" strokeWidth={2} />
            <h2 className="type-legend text-foreground">Coming up</h2>
            <span className="font-mono text-[12px] text-muted-foreground">{upcoming.length}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {upcoming.length === 0 && (
              <p className="px-1 py-2 text-[12.5px] text-muted-foreground">
                No interviews scheduled ahead.
              </p>
            )}
            <div className="space-y-1.5">
              {upcoming.map((c) => (
                <button
                  key={c.id}
                  onClick={() => open(c)}
                  className="relative flex w-full items-start gap-3 border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-foreground/50"
                >
                  <span
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ backgroundColor: c.groupColor }}
                  />
                  <span className="flex h-9 w-10 shrink-0 flex-col items-center justify-center border bg-background">
                    <span className="font-mono text-[13px] leading-none font-semibold text-foreground">
                      {new Date(c.interviewDate!).getDate()}
                    </span>
                    <span className="text-[9px] tracking-wide text-muted-foreground uppercase">
                      {new Date(c.interviewDate!).toLocaleDateString("en-GB", { month: "short" })}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{c.name}</p>
                    {c.company && (
                      <p className="truncate text-[11.5px] text-muted-foreground">{c.company}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.stage && (
                        <span
                          className="border px-1.5 py-0.5 text-[10.5px] font-semibold"
                          style={chipTint(c.stage.color)}
                        >
                          {c.stage.label}
                        </span>
                      )}
                      {c.followup && c.followup.label !== "No follow-up" && (
                        <span
                          className="border px-1.5 py-0.5 text-[10.5px] font-semibold"
                          style={chipTint(c.followup.color)}
                        >
                          {c.followup.label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <ContactDrawer contact={selected} board={board} onClose={() => setSelectedId(null)} />
    </div>
  );
}
