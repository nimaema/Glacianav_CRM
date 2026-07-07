"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { createStage } from "@/actions/board";
import { STATUS_COLORS } from "@/lib/status-colors";
import { initials, type ContactDTO, type StatusDTO } from "@/lib/board-types";
import { cn } from "@/lib/utils";

export function StageDock({
  stages,
  contacts,
  activeStageId,
  onSelect,
  isAdmin,
}: {
  stages: StatusDTO[];
  contacts: ContactDTO[];
  activeStageId: string | null;
  onSelect: (stageId: string | null) => void;
  isAdmin: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-6">
      <div className="pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl border border-border bg-card/95 p-1.5 shadow-[0_8px_30px_-8px_rgba(9,20,38,0.25)] backdrop-blur">
        {stages.map((stage) => {
          const inStage = contacts.filter((c) => c.stage?.id === stage.id);
          const active = activeStageId === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelect(active ? null : stage.id)}
              aria-pressed={active}
              aria-label={`${stage.label}: ${inStage.length} contacts`}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-muted",
                active && "bg-muted"
              )}
              style={active ? { boxShadow: `inset 0 -2px 0 ${stage.color}` } : undefined}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-[12px] font-medium whitespace-nowrap text-foreground">
                {stage.label}
              </span>
              <span className="font-mono text-[12px] font-semibold text-muted-foreground">
                {inStage.length}
              </span>
              {inStage.length > 0 && (
                <span className="flex -space-x-1.5">
                  {inStage.slice(0, 4).map((c) => (
                    <span
                      key={c.id}
                      title={c.name}
                      className="flex size-5 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-background"
                      style={{ backgroundColor: stage.color }}
                    >
                      {initials(c.name)}
                    </span>
                  ))}
                  {inStage.length > 4 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground ring-2 ring-background">
                      +{inStage.length - 4}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}

        {activeStageId && (
          <button
            onClick={() => onSelect(null)}
            aria-label="Clear stage filter"
            className="flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear
          </button>
        )}

        {isAdmin && (
          <>
            <div className="mx-1 h-6 w-px shrink-0 bg-border" />
            <AddStage />
          </>
        )}
      </div>
    </div>
  );
}

function AddStage() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState<string>(STATUS_COLORS.teal);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!label.trim()) return;
    startTransition(async () => {
      await createStage(label.trim(), color);
      setLabel("");
      setOpen(false);
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Add stage"
          className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" strokeWidth={2.2} />
          Stage
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-56 p-3">
        <p className="mb-2 text-[12px] font-semibold text-foreground">New stage</p>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Stage name"
          className="mb-2.5 h-8 w-full rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:border-ring"
        />
        <div className="mb-3 grid grid-cols-5 gap-1.5">
          {Object.values(STATUS_COLORS).map((hex) => (
            <button
              key={hex}
              onClick={() => setColor(hex)}
              aria-label={`Color ${hex}`}
              className={cn(
                "size-7 rounded-md transition-transform hover:scale-110",
                color === hex && "ring-2 ring-ring ring-offset-2"
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <Button
          onClick={submit}
          disabled={!label.trim() || pending}
          className="h-7 w-full text-[12.5px] font-semibold"
        >
          {pending ? "Adding stage" : "Add stage"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
