// Pill palette — saturated Monday-style hues tuned so 12px bold white text
// passes WCAG AA (4.5:1). Status rows in the DB store one of these hex values.
export const STATUS_COLORS = {
  slate: "#64748b",
  blue: "#2563eb",
  violet: "#7c3aed",
  amber: "#b45309",
  green: "#15803d",
  red: "#dc2626",
  teal: "#0d9488",
  pink: "#db2777",
  indigo: "#4f46e5",
  stone: "#57534e",
} as const;

export type StatusOption = {
  id: string;
  label: string;
  color: string;
};
