"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, CalendarClock, BellRing, Flame } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/* ---------- Global search: routes to /contacts, Cmd+K focuses ---------- */

export function GlobalSearch() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form action="/contacts" className="relative">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        name="q"
        placeholder="Search contacts"
        autoComplete="off"
        className="h-8 w-56 rounded-md border border-transparent bg-muted pr-12 pl-8 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:bg-card"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border bg-card px-1 font-mono text-[10px] text-muted-foreground">
        ⌘K
      </kbd>
    </form>
  );
}

/* ---------- Global notifications bell ---------- */

export type BellItem = {
  id: string;
  kind: "interview" | "followup" | "stale";
  text: string;
  sub: string;
  updatedAt?: string; // stale candidates carry this for client-side thresholding
};

const STALE_KEY = "crm-stale-days";
const ICONS = { interview: CalendarClock, followup: BellRing, stale: Flame };
const ICON_COLORS = {
  interview: "text-primary",
  followup: "text-blue-600",
  stale: "text-orange-600",
};

export function GlobalBell({ items }: { items: BellItem[] }) {
  const router = useRouter();
  const [staleDays, setStaleDays] = useState(7);

  useEffect(() => {
    const raw = localStorage.getItem(STALE_KEY);
    if (raw && !Number.isNaN(Number(raw))) setStaleDays(Number(raw));
  }, []);

  const setThreshold = (days: number) => {
    setStaleDays(days);
    localStorage.setItem(STALE_KEY, String(days));
  };

  const visible = useMemo(() => {
    const cutoff = Date.now() - staleDays * 24 * 3600 * 1000;
    return items.filter(
      (n) =>
        n.kind !== "stale" ||
        (n.updatedAt !== undefined && new Date(n.updatedAt).getTime() < cutoff)
    );
  }, [items, staleDays]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Notifications: ${visible.length}`}
          className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-[18px]" strokeWidth={1.9} />
          {visible.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9.5px] font-semibold text-primary-foreground">
              {visible.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between text-[13px] font-semibold">
          Notifications
          <span className="font-mono text-[11px] font-normal text-muted-foreground">
            {visible.length} open
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {visible.length === 0 && (
            <p className="px-3 py-4 text-center text-[12.5px] text-muted-foreground">
              All clear. Nothing needs your attention.
            </p>
          )}
          {visible.map((n) => {
            const Icon = ICONS[n.kind];
            return (
              <DropdownMenuItem
                key={n.id}
                onSelect={() => router.push("/tasks")}
                className="items-start gap-2.5 py-2"
              >
                <Icon
                  className={cn("mt-0.5 size-4 shrink-0", ICON_COLORS[n.kind])}
                  strokeWidth={2}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-foreground">
                    {n.text}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">
                    {n.sub}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-[11.5px] text-muted-foreground">Mark cold after</span>
          {[3, 7, 14].map((d) => (
            <button
              key={d}
              onClick={() => setThreshold(d)}
              className={cn(
                "rounded-md px-2 py-0.5 font-mono text-[11.5px] font-semibold transition-colors",
                staleDays === d
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
