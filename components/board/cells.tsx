"use client";

import { useEffect, useState, useTransition } from "react";
import {
  MessageSquareText,
  CircleUserRound,
  X,
  Mail,
  BriefcaseBusiness,
  Smartphone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { initials, type ChannelKey, type UserDTO } from "@/lib/board-types";

/* ---------- Text ---------- */

export function TextCell({
  value,
  onSave,
  placeholder = "Add",
  className,
  strong = false,
}: {
  value: string | null;
  onSave: (v: string | null) => void;
  placeholder?: string;
  className?: string;
  strong?: boolean;
}) {
  const [local, setLocal] = useState(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  useEffect(() => setLocal(value), [value]);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const clean = draft.trim() || null;
          if (clean !== local) {
            setLocal(clean);
            onSave(clean);
          }
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(local ?? "");
            setEditing(false);
          }
        }}
        className={cn(
          "h-7 w-full min-w-0 rounded-md border border-ring bg-background px-1.5 text-[13px] outline-none",
          className
        )}
      />
    );
  }
  return (
    <button
      onClick={() => {
        setDraft(local ?? "");
        setEditing(true);
      }}
      className={cn(
        "h-7 w-full min-w-0 cursor-text truncate rounded-md px-1.5 text-left text-[13px] transition-colors hover:bg-black/[0.04]",
        strong && "font-medium",
        !local && "text-muted-foreground/60",
        className
      )}
    >
      {local || placeholder}
    </button>
  );
}

/* ---------- Date ---------- */

export function DateCell({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (v: string | null) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => setLocal(value ?? ""), [value]);

  return (
    <input
      type="date"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        onSave(e.target.value || null);
      }}
      aria-label="Interview date"
      className={cn(
        "h-7 w-full cursor-pointer rounded-md bg-transparent px-1 font-mono text-[12px] transition-colors outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring",
        !local && "text-muted-foreground/60"
      )}
    />
  );
}

/* ---------- Preferred contact channel ---------- */

const CHANNELS: Record<ChannelKey, { label: string; icon: typeof Mail }> = {
  EMAIL: { label: "Email", icon: Mail },
  LINKEDIN: { label: "LinkedIn", icon: BriefcaseBusiness },
  PHONE: { label: "Phone / text", icon: Smartphone },
};

export function ChannelCell({
  value,
  onSave,
}: {
  value: ChannelKey | null;
  onSave: (v: ChannelKey | null) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  const current = local ? CHANNELS[local] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={current ? `Preferred channel: ${current.label}` : "Set preferred channel"}
          className={cn(
            "inline-flex h-[22px] max-w-full items-center gap-1.5 rounded-full border px-2 text-[12px] font-medium whitespace-nowrap transition-colors",
            current
              ? "border-border bg-muted/60 text-foreground hover:bg-muted"
              : "border-dashed border-input text-muted-foreground/60 hover:border-ring hover:text-foreground"
          )}
        >
          {current ? (
            <>
              <current.icon className="size-3 text-primary" strokeWidth={2.2} />
              <span className="truncate">{current.label}</span>
            </>
          ) : (
            "Set channel"
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {(Object.keys(CHANNELS) as ChannelKey[]).map((key) => {
          const channel = CHANNELS[key];
          return (
            <DropdownMenuItem
              key={key}
              onSelect={() => {
                setLocal(key);
                onSave(key);
              }}
              className="gap-2 text-[13px]"
            >
              <channel.icon className="size-3.5 text-primary" strokeWidth={2} />
              {channel.label}
            </DropdownMenuItem>
          );
        })}
        {local && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setLocal(null);
                onSave(null);
              }}
              className="text-[12px] text-muted-foreground"
            >
              Clear
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- Owner ---------- */

export function OwnerCell({
  value,
  users,
  onSave,
}: {
  value: UserDTO | null;
  users: UserDTO[];
  onSave: (userId: string | null) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={local ? `Lead: ${local.name}` : "Assign lead"}
          className="inline-flex size-7 items-center justify-center rounded-full transition-[filter] hover:brightness-95"
        >
          {local ? (
            <span
              className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: local.color }}
            >
              {initials(local.name)}
            </span>
          ) : (
            <CircleUserRound className="size-5 text-muted-foreground/40" strokeWidth={1.5} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {users.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onSelect={() => {
              setLocal(user);
              onSave(user.id);
            }}
            className="gap-2 text-[13px]"
          >
            <span
              className="flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: user.color }}
            >
              {initials(user.name)}
            </span>
            {user.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            setLocal(null);
            onSave(null);
          }}
          className="text-[12px] text-muted-foreground"
        >
          Unassigned
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- Notes count ---------- */

export function NotesCell({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-1 text-muted-foreground"
      title="Interview notes open in the item drawer (component 5)"
    >
      <MessageSquareText className="size-3.5" strokeWidth={1.8} />
      <span className="font-mono text-[12px]">{count}</span>
    </div>
  );
}

/* ---------- shared save-transition helper ---------- */

export function useCellSave() {
  const [, startTransition] = useTransition();
  return (fn: () => Promise<void>) => startTransition(() => fn());
}
