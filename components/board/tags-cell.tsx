"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TagDTO } from "@/lib/board-types";

export function TagsCell({
  value,
  allTags,
  onToggle,
  onCreate,
}: {
  value: TagDTO[];
  allTags: TagDTO[];
  onToggle: (tagId: string, on: boolean) => void;
  onCreate: (name: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const [query, setQuery] = useState("");
  useEffect(() => setLocal(value), [value]);

  const filtered = useMemo(
    () => allTags.filter((t) => t.name.includes(query.trim().toLowerCase())),
    [allTags, query]
  );
  const exactMatch = allTags.some((t) => t.name === query.trim().toLowerCase());
  const selectedIds = new Set(local.map((t) => t.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Needs and problems"
          className="flex h-7 w-full min-w-0 items-center gap-1 overflow-hidden rounded-md px-1 transition-colors hover:bg-black/[0.04]"
        >
          {local.length === 0 && (
            <span className="px-0.5 text-[13px] text-muted-foreground/60">Add needs</span>
          )}
          {local.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="max-w-24 truncate rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-secondary-foreground"
            >
              {tag.name}
            </span>
          ))}
          {local.length > 2 && (
            <span className="text-[11px] font-medium text-muted-foreground">
              +{local.length - 2}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1.5">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or create a need"
          className="mb-1.5 h-7 w-full rounded-md border border-input bg-background px-2 text-[12.5px] outline-none focus-visible:border-ring"
        />
        <div className="max-h-52 space-y-px overflow-auto">
          {filtered.map((tag) => {
            const on = selectedIds.has(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => {
                  setLocal((prev) => (on ? prev.filter((t) => t.id !== tag.id) : [...prev, tag]));
                  onToggle(tag.id, !on);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-muted",
                  on && "font-medium"
                )}
              >
                <span className="truncate">{tag.name}</span>
                {on && <Check className="size-3.5 shrink-0 text-primary" strokeWidth={2.5} />}
              </button>
            );
          })}
          {query.trim() && !exactMatch && (
            <button
              onClick={() => {
                const name = query.trim().toLowerCase();
                setLocal((prev) => [...prev, { id: `optimistic-${name}`, name }]);
                onCreate(name);
                setQuery("");
              }}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12.5px] text-primary transition-colors hover:bg-secondary"
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              Create “{query.trim().toLowerCase()}”
            </button>
          )}
          {filtered.length === 0 && !query.trim() && (
            <p className="px-2 py-1.5 text-[12px] text-muted-foreground">No needs tagged yet.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
