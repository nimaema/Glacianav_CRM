"use client";

import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { chipTint } from "@/lib/board-types";
import type { StatusOption } from "@/lib/status-colors";

type StatusPillProps = {
  value: StatusOption | null;
  options: StatusOption[];
  onChange: (option: StatusOption) => void;
  /** Accessible name for the cell, e.g. "Validation stage for Dana Kiani" */
  label: string;
  placeholder?: string;
  className?: string;
};

export function StatusPill({
  value,
  options,
  onChange,
  label,
  placeholder = "Set status",
  className,
}: StatusPillProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={label}
          className={cn(
            "relative inline-flex h-[22px] max-w-full min-w-0 items-center border pr-2 pl-2.5 text-[12px] font-semibold whitespace-nowrap transition-[filter,background-color,border-color] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            value
              ? "hover:brightness-[0.97]"
              : "border-dashed border-input bg-transparent font-medium text-muted-foreground/80 hover:border-ring hover:text-foreground",
            className
          )}
          style={value ? chipTint(value.color) : undefined}
        >
          {/* flag chip: solid color blaze on the leading edge */}
          {value && (
            <span
              className="absolute inset-y-[-1px] left-[-1px] w-[3px]"
              style={{ backgroundColor: value.color }}
              aria-hidden="true"
            />
          )}
          <span className="truncate">{value ? value.label : placeholder}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[248px] p-2">
        <div className="grid grid-cols-2 gap-1.5">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onSelect={() => onChange(option)}
              className="relative flex h-8 items-center justify-center gap-1 overflow-hidden rounded-none border p-0 text-[12px] font-semibold data-[highlighted]:ring-2 data-[highlighted]:ring-ring data-[highlighted]:ring-offset-1"
              style={chipTint(option.color)}
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ backgroundColor: option.color }}
                aria-hidden="true"
              />
              <span className="truncate px-1">{option.label}</span>
              {value?.id === option.id && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
