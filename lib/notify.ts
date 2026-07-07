export type NotifyPrefs = {
  staleDays: number;
  interviews: boolean;
  followups: boolean;
  stale: boolean;
};

export const DEFAULT_NOTIFY: NotifyPrefs = {
  staleDays: 7,
  interviews: true,
  followups: true,
  stale: true,
};
