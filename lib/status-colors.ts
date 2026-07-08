// V2 "Alpine Modernist" data palette — Landeskarte hues (rock, glacier, forest,
// contour, route…). Desaturated map colors: every hue passes WCAG AA (4.5:1)
// as 12px chip text on its 12% tint. Status/Group rows in the DB store one of
// these hex values.
export const STATUS_COLORS = {
  slate: "#5b6b78", // rock
  blue: "#33688c", // glacier
  violet: "#6d5a8e", // shadow
  amber: "#9c6b3f", // contour
  green: "#47704a", // forest
  red: "#c6362c", // route
  teal: "#3e7d7b", // ice
  pink: "#a45a74", // moraine
  indigo: "#46557f", // night
  stone: "#7a6f5f", // scree
} as const;

export type StatusOption = {
  id: string;
  label: string;
  color: string;
};
