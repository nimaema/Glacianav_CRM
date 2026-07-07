"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowUpDown,
  ListFilter,
  Mail,
  BriefcaseBusiness,
  Smartphone,
  MessagesSquare,
  ExternalLink,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewContactDialog } from "@/components/shell/new-contact-dialog";
import { Button } from "@/components/ui/button";
import { getContactDetail, type ContactDetail } from "@/actions/board";
import { chipTint, initials, type BoardDTO, type ContactDTO } from "@/lib/board-types";
import { cn } from "@/lib/utils";

const CHANNEL = {
  EMAIL: { icon: Mail, label: "Email" },
  LINKEDIN: { icon: BriefcaseBusiness, label: "LinkedIn" },
  PHONE: { icon: Smartphone, label: "Phone / text" },
};

type Row = ContactDTO & { groupName: string; groupColor: string };

const SORTS = [
  { key: "name", label: "Name A–Z" },
  { key: "recent", label: "Recently updated" },
  { key: "stage", label: "Stage" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

export function ContactsView({
  board,
  initialQuery = "",
}: {
  board: BoardDTO;
  initialQuery?: string;
}) {
  const rows = useMemo<Row[]>(
    () =>
      board.groups.flatMap((g) =>
        g.contacts.map((c) => ({ ...c, groupName: g.name, groupColor: g.color }))
      ),
    [board.groups]
  );
  const stageOrder = useMemo(
    () => new Map(board.stages.map((s, i) => [s.id, i])),
    [board.stages]
  );

  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>("name");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((c) => {
      if (stageFilter && c.stage?.id !== stageFilter) return false;
      if (ownerFilter !== null) {
        if (ownerFilter === "none" ? c.owner !== null : c.owner?.id !== ownerFilter) return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        c.tags.some((t) => t.name.includes(q))
      );
    });
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recent") return b.updatedAt.localeCompare(a.updatedAt);
      return (stageOrder.get(a.stage?.id ?? "") ?? 99) - (stageOrder.get(b.stage?.id ?? "") ?? 99);
    });
    return list;
  }, [rows, query, sort, stageFilter, ownerFilter, stageOrder]);

  const selected = rows.find((c) => c.id === selectedId) ?? null;
  const filterActive = stageFilter !== null || ownerFilter !== null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border px-8 pt-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
            <span className="text-[12.5px] font-medium tabular-nums text-muted-foreground">
              {filtered.length} of {rows.length}
            </span>
          </div>
          <NewContactDialog
            groups={board.groups.map((g) => ({ id: g.id, name: g.name, color: g.color }))}
            trigger={
              <Button className="h-8 bg-primary px-3 text-[13px] font-semibold text-white hover:bg-[#0043b0]">
                New contact
              </Button>
            }
          />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, company, or need"
              className="h-8 w-72 rounded-md border border-border bg-muted pr-7 pl-8 text-[13px] outline-none focus-visible:border-input focus-visible:bg-background"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" strokeWidth={2.2} />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ArrowUpDown className="size-3.5" strokeWidth={1.8} />
                {SORTS.find((s) => s.key === sort)!.label}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                {SORTS.map((s) => (
                  <DropdownMenuRadioItem key={s.key} value={s.key} className="text-[13px]">
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[13px] font-medium transition-colors hover:bg-muted hover:text-foreground",
                  filterActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <ListFilter className="size-3.5" strokeWidth={1.8} />
                Filter
                {filterActive && <span className="size-1.5 rounded-full bg-primary" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Stage
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={stageFilter ?? "all"}
                onValueChange={(v) => setStageFilter(v === "all" ? null : v)}
              >
                <DropdownMenuRadioItem value="all" className="text-[13px]">
                  All stages
                </DropdownMenuRadioItem>
                {board.stages.map((s) => (
                  <DropdownMenuRadioItem key={s.id} value={s.id} className="gap-2 text-[13px]">
                    <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Lead
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={ownerFilter ?? "all"}
                onValueChange={(v) => setOwnerFilter(v === "all" ? null : v)}
              >
                <DropdownMenuRadioItem value="all" className="text-[13px]">
                  Everyone
                </DropdownMenuRadioItem>
                {board.users.map((u) => (
                  <DropdownMenuRadioItem key={u.id} value={u.id} className="text-[13px]">
                    {u.name}
                  </DropdownMenuRadioItem>
                ))}
                <DropdownMenuRadioItem value="none" className="text-[13px] text-muted-foreground">
                  Unassigned
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="w-[420px] shrink-0 overflow-y-auto border-r border-border">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "relative flex w-full items-center gap-3 border-b border-border/60 px-4 py-2.5 text-left transition-colors",
                selectedId === c.id ? "bg-secondary/60" : "hover:bg-muted/60"
              )}
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ backgroundColor: c.groupColor }}
              />
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: c.groupColor }}
              >
                {initials(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground">{c.name}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {c.company ?? c.groupName}
                </p>
              </div>
              {c.stage && (
                <span
                  className="shrink-0 rounded-md border px-2 py-0.5 text-[10.5px] font-semibold"
                  style={chipTint(c.stage.color)}
                >
                  {c.stage.label}
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              No contacts match.
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto">
          {selected ? (
            <ContactDetailPanel contact={selected} board={board} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Users className="size-8" strokeWidth={1.5} />
              <p className="text-[13px]">Select a contact to see their profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactDetailPanel({ contact, board }: { contact: Row; board: BoardDTO }) {
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  useEffect(() => {
    setDetail(null);
    getContactDetail(contact.id).then(setDetail);
  }, [contact.id]);

  const Channel = contact.channel ? CHANNEL[contact.channel] : null;
  const facts: [string, React.ReactNode][] = [
    ["Segment", contact.groupName],
    [
      "Stage",
      contact.stage ? (
        <Pill label={contact.stage.label} color={contact.stage.color} />
      ) : (
        <Muted />
      ),
    ],
    [
      "Problem",
      contact.problem && contact.problem.label !== "Not asked" ? (
        <Pill label={contact.problem.label} color={contact.problem.color} />
      ) : (
        <Muted text="Not asked" />
      ),
    ],
    [
      "Follow-up",
      contact.followup && contact.followup.label !== "No follow-up" ? (
        <Pill label={contact.followup.label} color={contact.followup.color} />
      ) : (
        <Muted text="None" />
      ),
    ],
    ["Lead", contact.owner ? contact.owner.name : <Muted text="Unassigned" />],
    [
      "Channel",
      Channel ? (
        <span className="flex items-center gap-1.5 text-[13px] text-foreground">
          <Channel.icon className="size-3.5 text-primary" strokeWidth={2} />
          {Channel.label}
        </span>
      ) : (
        <Muted />
      ),
    ],
    ["Email", contact.email ?? <Muted />],
    ["Phone", contact.phone ?? <Muted />],
    ["Interview", contact.interviewDate ?? <Muted text="Not set" />],
  ];

  return (
    <div className="max-w-2xl px-8 py-6">
      <div className="flex items-start gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
          style={{ backgroundColor: contact.groupColor }}
        >
          {initials(contact.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] font-bold tracking-tight text-foreground">{contact.name}</h2>
          {contact.company && (
            <p className="text-[13px] text-muted-foreground">{contact.company}</p>
          )}
        </div>
        <Link
          href="/board"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-3.5" strokeWidth={2} />
          Open in board
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border p-4">
        {facts.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <dt className="text-[12px] text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate text-right text-[13px] text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {contact.tags.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
            Needs / problems
          </p>
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map((t) => (
              <span
                key={t.id}
                className="rounded-md bg-secondary px-2 py-1 text-[12px] font-medium text-secondary-foreground"
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
          <MessagesSquare className="size-3.5" strokeWidth={2} />
          Interview notes
        </p>
        {detail === null && <p className="text-[12.5px] text-muted-foreground">Loading…</p>}
        {detail?.notes.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">
            No interviews logged. Open this contact in the board to add one.
          </p>
        )}
        <div className="space-y-2.5">
          {detail?.notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-border p-3.5">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[12.5px] font-semibold text-foreground capitalize">
                  {n.type.toLowerCase()}
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  {new Date(n.interviewDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                  {n.durationMin ? ` · ${n.durationMin}m` : ""}
                </span>
              </div>
              {n.quotes && (
                <p className="mb-1.5 border-l-2 border-primary/40 pl-2 text-[12.5px] leading-relaxed whitespace-pre-line text-secondary-foreground italic">
                  {n.quotes}
                </p>
              )}
              {n.body && (
                <p className="text-[12.5px] leading-relaxed whitespace-pre-line text-foreground">
                  {n.body}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex rounded-md border px-2 py-0.5 text-[11.5px] font-semibold"
      style={chipTint(color)}
    >
      {label}
    </span>
  );
}

function Muted({ text = "—" }: { text?: string }) {
  return <span className="text-muted-foreground/60">{text}</span>;
}
