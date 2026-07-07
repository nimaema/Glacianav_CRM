// Column registry for the main table. "Contact" is always visible; the rest
// are user-toggleable via the Columns menu (persisted in localStorage).

export type ColumnKey =
  | "stage"
  | "problem"
  | "needs"
  | "channel"
  | "solution"
  | "followup"
  | "owner"
  | "interview"
  | "priority"
  | "next"
  | "notes";

export const COLUMN_DEFS: { key: ColumnKey; label: string; width: number }[] = [
  { key: "stage", label: "Stage", width: 150 },
  { key: "problem", label: "Problem", width: 145 },
  { key: "needs", label: "Needs / problems", width: 230 },
  { key: "channel", label: "Channel", width: 130 },
  { key: "solution", label: "Current solution", width: 200 },
  { key: "followup", label: "Follow-up", width: 150 },
  { key: "owner", label: "Lead", width: 64 },
  { key: "interview", label: "Interview", width: 140 },
  { key: "priority", label: "Priority", width: 120 },
  { key: "next", label: "Next step", width: 200 },
  { key: "notes", label: "Notes", width: 64 },
];

// Fits a laptop screen without horizontal scroll; the rest live in the drawer.
export const DEFAULT_VISIBLE: ColumnKey[] = [
  "stage",
  "problem",
  "needs",
  "followup",
  "owner",
  "interview",
  "notes",
];

export const NAME_COLUMN_WIDTH = 230;

export function gridTemplate(visible: ColumnKey[]) {
  const widths = COLUMN_DEFS.filter((c) => visible.includes(c.key)).map(
    (c) => `${c.width}px`
  );
  return `${NAME_COLUMN_WIDTH}px ${widths.join(" ")}`;
}
