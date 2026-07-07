"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Link2, Check } from "lucide-react";
import type { BoardDTO, ContactDTO } from "@/lib/board-types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BoardCalendar({
  board,
  onOpenContact,
}: {
  board: BoardDTO;
  onOpenContact: (contact: ContactDTO) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [copied, setCopied] = useState(false);

  const eventsByDay = useMemo(() => {
    const groupColor = new Map(board.groups.map((g) => [g.id, g.color]));
    const map = new Map<string, (ContactDTO & { color: string })[]>();
    for (const contact of board.groups.flatMap((g) => g.contacts)) {
      if (!contact.interviewDate) continue;
      const list = map.get(contact.interviewDate) ?? [];
      list.push({ ...contact, color: groupColor.get(contact.groupId) ?? "#64748b" });
      map.set(contact.interviewDate, list);
    }
    return map;
  }, [board.groups]);

  // 6-week grid starting on the Monday on or before the 1st
  const days = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(1 - ((start.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const todayIso = new Date().toLocaleDateString("sv-SE");
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const copyFeed = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/calendar.ics`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col px-8 py-5">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="w-44 text-[16px] font-bold tracking-tight text-foreground">
          {monthLabel}
        </h2>
        <button
          aria-label="Previous month"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" strokeWidth={2} />
        </button>
        <button
          aria-label="Next month"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-4" strokeWidth={2} />
        </button>
        <button
          onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
          className="rounded-md px-2 py-1 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Today
        </button>
        <span className="flex-1" />
        <button
          onClick={copyFeed}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5 text-primary" strokeWidth={2.5} />
          ) : (
            <Link2 className="size-3.5" strokeWidth={2} />
          )}
          {copied ? "Feed URL copied" : "Copy calendar feed"}
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-border pb-1.5">
        {WEEKDAYS.map((d) => (
          <span key={d} className="px-2 text-[11px] font-semibold text-muted-foreground">
            {d}
          </span>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-y-auto">
        {days.map((day) => {
          const iso = day.toLocaleDateString("sv-SE");
          const inMonth = day.getMonth() === cursor.getMonth();
          const events = eventsByDay.get(iso) ?? [];
          return (
            <div
              key={iso}
              className={cn(
                "min-h-20 border-r border-b border-border/60 p-1.5 last:border-r-0",
                !inMonth && "bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-[11.5px] tabular-nums",
                  iso === todayIso
                    ? "bg-primary font-bold text-primary-foreground"
                    : inMonth
                      ? "text-foreground"
                      : "text-muted-foreground/50"
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {events.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onOpenContact(event)}
                    className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <span className="truncate">{event.name}</span>
                  </button>
                ))}
                {events.length > 3 && (
                  <span className="px-1 text-[10.5px] text-muted-foreground">
                    +{events.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
