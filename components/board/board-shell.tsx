"use client";

import { useEffect, useMemo, useState } from "react";
import { BoardHeader, type BoardView } from "@/components/shell/board-header";
import { BoardTable } from "@/components/board/board-table";
import { BoardKanban } from "@/components/board/board-kanban";
import { ContactDrawer } from "@/components/board/contact-drawer";
import { DEFAULT_VISIBLE, type ColumnKey } from "@/lib/board-columns";
import type { BoardDTO, BoardStats, ContactDTO } from "@/lib/board-types";

const COLUMNS_STORAGE_KEY = "crm-visible-columns";

export function BoardShell({
  board,
  stats,
  contactCount,
  isAdmin,
}: {
  board: BoardDTO;
  stats: BoardStats;
  contactCount: number;
  isAdmin: boolean;
}) {
  const [view, setView] = useState<BoardView>("table");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE);
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (raw) {
      try {
        setVisibleColumns(JSON.parse(raw));
      } catch {
        // corrupted value; fall back to defaults
      }
    }
  }, []);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const frozen = query.trim().length > 0 || ownerFilter !== null;

  // Apply search + owner filter without touching the source board object.
  const filteredBoard = useMemo<BoardDTO>(() => {
    if (!frozen) return board;
    const q = query.trim().toLowerCase();
    const match = (c: ContactDTO) => {
      if (ownerFilter !== null) {
        if (ownerFilter === "none" ? c.owner !== null : c.owner?.id !== ownerFilter) return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        c.tags.some((t) => t.name.includes(q))
      );
    };
    return {
      ...board,
      groups: board.groups.map((g) => ({ ...g, contacts: g.contacts.filter(match) })),
    };
  }, [board, frozen, query, ownerFilter]);

  const selected = useMemo<ContactDTO | null>(
    () => board.groups.flatMap((g) => g.contacts).find((c) => c.id === selectedId) ?? null,
    [board.groups, selectedId]
  );

  const open = (contact: ContactDTO) => setSelectedId(contact.id);
  const matchCount = filteredBoard.groups.reduce((n, g) => n + g.contacts.length, 0);

  return (
    <>
      <BoardHeader
        stats={stats}
        contactCount={contactCount}
        view={view}
        onViewChange={setView}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        groups={board.groups}
        query={query}
        onQuery={setQuery}
        owners={board.users}
        ownerFilter={ownerFilter}
        onOwnerFilter={setOwnerFilter}
        matchCount={frozen ? matchCount : null}
      />
      {view === "table" && (
        <BoardTable
          board={filteredBoard}
          onOpenContact={open}
          visibleColumns={visibleColumns}
          frozen={frozen}
          isAdmin={isAdmin}
        />
      )}
      {view === "kanban" && <BoardKanban board={filteredBoard} onOpenContact={open} />}
      <ContactDrawer contact={selected} board={board} onClose={() => setSelectedId(null)} />
    </>
  );
}
