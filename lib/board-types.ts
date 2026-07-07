// Plain serializable DTOs passed from server components to the client board.
// (Prisma Date values are converted in the page mapper.)

export type StatusColumnKey = "STAGE" | "FOLLOWUP" | "PRIORITY" | "PROBLEM";

export type ChannelKey = "EMAIL" | "LINKEDIN" | "PHONE";



export type StatusDTO = {
  id: string;
  label: string;
  color: string;
  column: StatusColumnKey;
  position: number;
};

export type UserDTO = { id: string; name: string; color: string };

export type TagDTO = { id: string; name: string };

export type ContactDTO = {
  id: string;
  groupId: string;
  position: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  channel: ChannelKey | null; // preferred means of contact
  stage: StatusDTO | null;
  followup: StatusDTO | null;
  problem: StatusDTO | null; // did they confirm the problem?
  priority: StatusDTO | null;
  owner: UserDTO | null;
  interviewDate: string | null; // ISO yyyy-mm-dd
  currentSolution: string | null;
  nextStep: string | null;
  tags: TagDTO[];
  notesCount: number;
  updatedAt: string; // ISO — drives stale-contact detection
};

export type GroupDTO = {
  id: string;
  name: string;
  color: string;
  position: number;
  contacts: ContactDTO[];
};

export type BoardDTO = {
  id: string;
  name: string;
  groups: GroupDTO[];
  stages: StatusDTO[];
  followups: StatusDTO[];
  problems: StatusDTO[];
  priorities: StatusDTO[];
  users: UserDTO[];
  tags: TagDTO[];
};

export type BoardStats = {
  interviews: number;
  problemPct: number; // % of assessed contacts who confirmed the problem
  validatedPct: number;
  topNeed: { name: string; count: number } | null;
  followupsDue: number;
};

export type InsightsData = {
  needs: { name: string; count: number }[];
  funnel: { label: string; color: string; count: number }[];
  problems: { label: string; color: string; count: number }[];
  weekly: { label: string; count: number }[]; // interview notes per week, last 8
  owners: { name: string; color: string; count: number }[];
};

// Executive chip: light tint of the status color with the color itself as text.
export function chipTint(color: string) {
  return {
    backgroundColor: `color-mix(in srgb, ${color} 12%, #ffffff)`,
    borderColor: `color-mix(in srgb, ${color} 32%, #ffffff)`,
    color,
  };
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

