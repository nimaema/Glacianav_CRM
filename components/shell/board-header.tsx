"use client";

import {
  Search,
  Plus,
  Table2,
  SquareKanban,
  ListFilter,
  X,
  Columns3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewContactDialog } from "@/components/shell/new-contact-dialog";
import { COLUMN_DEFS, type ColumnKey } from "@/lib/board-columns";
import { cn } from "@/lib/utils";
import { initials, type BoardStats, type GroupDTO, type UserDTO } from "@/lib/board-types";

export type BoardView = "table" | "kanban";

export function BoardHeader({
  boardName,
  stats,
  contactCount,
  view,
  onViewChange,
  visibleColumns,
  onToggleColumn,
  bell,
  groups,
  query,
  onQuery,
  owners,
  ownerFilter,
  onOwnerFilter,
  matchCount,
}: {
  boardName: string;
  stats: BoardStats;
  contactCount: number;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  visibleColumns: ColumnKey[];
  onToggleColumn: (key: ColumnKey) => void;
  bell?: React.ReactNode;
  groups: GroupDTO[];
  query: string;
  onQuery: (q: string) => void;
  owners: UserDTO[];
  ownerFilter: string | null;
  onOwnerFilter: (id: string | null) => void;
  matchCount: number | null;
}) {
  const cells = [
    { label: "Interviews", value: String(stats.interviews) },
    { label: "Problem confirmed", value: `${stats.problemPct}%` },
    { label: "Validated", value: `${stats.validatedPct}%` },
    {
      label: stats.topNeed ? `Top need, ${stats.topNeed.count} contacts` : "Top need",
      value: stats.topNeed ? stats.topNeed.name : "none yet",
    },
    { label: "Follow-ups open", value: String(stats.followupsDue) },
  ];

  const views: { key: BoardView; label: string; icon: typeof Table2 }[] = [
    { key: "table", label: "Main table", icon: Table2 },
    { key: "kanban", label: "Kanban", icon: SquareKanban },
  ];

  const hiddenCount = COLUMN_DEFS.length - visibleColumns.length;

  return (
    <header className="shrink-0 bg-background">
      <div className="flex flex-wrap items-end justify-between gap-4 px-8 pt-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="size-2 bg-signal" aria-hidden="true" />
            <span className="type-legend text-muted-foreground">
              Board / {contactCount} contacts
            </span>
          </div>
          <h1 className="type-poster mt-2 text-[clamp(26px,3vw,36px)] text-foreground">
            {boardName}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {bell}
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Filter board"
              className="h-9 w-48 rounded-none border-input bg-background pr-7 pl-8 text-[13px] shadow-none"
            />
            {query && (
              <button
                onClick={() => onQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" strokeWidth={2.2} />
              </button>
            )}
          </div>
          <NewContactDialog
            groups={groups.map((g) => ({ id: g.id, name: g.name, color: g.color }))}
            trigger={
              <Button className="h-9 px-3.5 text-[13px] font-semibold transition-colors hover:bg-signal hover:text-white">
                <Plus className="size-4" strokeWidth={2.5} />
                New contact
              </Button>
            }
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px border-y bg-border px-0 sm:grid-cols-3 lg:grid-cols-5">
        {cells.map((cell) => (
          <div key={cell.label} className="min-w-0 bg-background px-5 py-3">
            <span className="block truncate text-[20px] leading-tight font-bold tracking-tight tabular-nums text-foreground">
              {cell.value}
            </span>
            <span className="type-legend block truncate text-muted-foreground">
              {cell.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b border-border px-6 py-2">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onViewChange(v.key)}
            aria-pressed={view === v.key}
            className={cn(
              "relative flex h-8 items-center gap-1.5 px-3 text-[13px] transition-colors duration-150",
              view === v.key
                ? "bg-foreground font-semibold text-background"
                : "font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {view === v.key && (
              <span className="absolute inset-y-0 left-0 w-[3px] bg-signal" aria-hidden="true" />
            )}
            <v.icon className="size-3.5" strokeWidth={2.2} />
            {v.label}
          </button>
        ))}
        <div className="mx-2 h-4 w-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex h-8 items-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors duration-150 hover:bg-secondary hover:text-foreground",
                ownerFilter !== null ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <ListFilter className="size-3.5" strokeWidth={1.8} />
              Filter
              {ownerFilter !== null && <span className="size-1.5 bg-signal" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Filter by lead
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={ownerFilter ?? "all"}
              onValueChange={(v) => onOwnerFilter(v === "all" ? null : v)}
            >
              <DropdownMenuRadioItem value="all" className="text-[13px]">
                Everyone
              </DropdownMenuRadioItem>
              {owners.map((o) => (
                <DropdownMenuRadioItem key={o.id} value={o.id} className="gap-2 text-[13px]">
                  <span
                    className="flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    style={{ backgroundColor: o.color }}
                  >
                    {initials(o.name)}
                  </span>
                  {o.name}
                </DropdownMenuRadioItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="none" className="text-[13px] text-muted-foreground">
                Unassigned
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {matchCount !== null && (
          <span className="ml-1 font-mono text-[12px] tabular-nums text-muted-foreground">
            {matchCount} match{matchCount === 1 ? "" : "es"}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex h-8 items-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors duration-150 hover:bg-secondary hover:text-foreground",
                view === "table" ? "text-muted-foreground" : "hidden"
              )}
            >
              <Columns3 className="size-3.5" strokeWidth={1.8} />
              Columns
              {hiddenCount > 0 && (
                <span className="border px-1.5 font-mono text-[10.5px] font-semibold text-secondary-foreground">
                  {hiddenCount} hidden
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Show columns
            </DropdownMenuLabel>
            {COLUMN_DEFS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visibleColumns.includes(col.key)}
                onCheckedChange={() => onToggleColumn(col.key)}
                onSelect={(e) => e.preventDefault()}
                className="text-[13px]"
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
