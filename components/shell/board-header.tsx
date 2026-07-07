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
      <div className="flex items-center justify-between gap-4 px-8 pt-6">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Customer Validation
          </h1>
          <span className="font-mono text-[12px] font-medium text-muted-foreground">
            {contactCount} contacts
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {bell}
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Filter board"
              className="h-8 w-44 border-transparent bg-muted pr-7 pl-8 text-[13px] shadow-none focus-visible:bg-card"
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
              <Button className="h-8 bg-primary px-3 text-[13px] font-semibold text-white hover:bg-[#0043b0]">
                <Plus className="size-4" strokeWidth={2.5} />
                New contact
              </Button>
            }
          />
        </div>
      </div>

      <div className="mt-5 flex items-center divide-x divide-border px-8">
        {cells.map((cell) => (
          <div key={cell.label} className="flex min-w-0 flex-col gap-px pr-8 pl-8 first:pl-0">
            <span className="truncate text-[19px] font-bold tracking-tight tabular-nums text-foreground">
              {cell.value}
            </span>
            <span className="truncate text-[11.5px] font-medium text-muted-foreground">
              {cell.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-1 border-b border-border px-6">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onViewChange(v.key)}
            aria-pressed={view === v.key}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-2.5 pb-2 text-[13px] transition-colors",
              view === v.key
                ? "border-primary font-semibold text-foreground"
                : "border-transparent font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            <v.icon
              className={cn("size-3.5", view === v.key && "text-primary")}
              strokeWidth={2.2}
            />
            {v.label}
          </button>
        ))}
        <div className="mx-2 mb-2 h-4 w-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "mb-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium transition-colors hover:bg-muted hover:text-foreground",
                ownerFilter !== null ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <ListFilter className="size-3.5" strokeWidth={1.8} />
              Filter
              {ownerFilter !== null && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
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
          <span className="mb-1 ml-1 text-[12px] tabular-nums text-muted-foreground">
            {matchCount} match{matchCount === 1 ? "" : "es"}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "mb-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium transition-colors hover:bg-muted hover:text-foreground",
                view === "table" ? "text-muted-foreground" : "hidden"
              )}
            >
              <Columns3 className="size-3.5" strokeWidth={1.8} />
              Columns
              {hiddenCount > 0 && (
                <span className="rounded-full bg-secondary px-1.5 text-[10.5px] font-semibold text-secondary-foreground">
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
