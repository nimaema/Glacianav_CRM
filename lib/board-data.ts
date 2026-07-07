import { prisma } from "@/lib/prisma";
import type {
  BoardDTO,
  BoardStats,
  ContactDTO,
  InsightsData,
  StatusDTO,
} from "@/lib/board-types";

function toStatus(s: {
  id: string;
  label: string;
  color: string;
  column: "STAGE" | "FOLLOWUP" | "PRIORITY" | "PROBLEM";
  position: number;
}): StatusDTO {
  return { id: s.id, label: s.label, color: s.color, column: s.column, position: s.position };
}

// Single source of truth for board data — shared by /board, /contacts, /tasks.
export async function getBoard(): Promise<{
  dto: BoardDTO;
  contacts: ContactDTO[];
  stats: BoardStats;
  insights: InsightsData;
} | null> {
  const board = await prisma.board.findFirst({
    include: {
      statuses: { orderBy: { position: "asc" } },
      groups: {
        orderBy: { position: "asc" },
        include: {
          contacts: {
            orderBy: { position: "asc" },
            include: {
              stage: true,
              followup: true,
              problem: true,
              priority: true,
              owner: true,
              tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
              _count: { select: { notes: true } },
            },
          },
        },
      },
    },
  });
  if (!board) return null;

  const [users, tags, noteDates] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.validationNote.findMany({ select: { interviewDate: true } }),
  ]);

  const dto: BoardDTO = {
    id: board.id,
    name: board.name,
    stages: board.statuses.filter((s) => s.column === "STAGE").map(toStatus),
    followups: board.statuses.filter((s) => s.column === "FOLLOWUP").map(toStatus),
    problems: board.statuses.filter((s) => s.column === "PROBLEM").map(toStatus),
    priorities: board.statuses.filter((s) => s.column === "PRIORITY").map(toStatus),
    users: users.map((u) => ({ id: u.id, name: u.name, color: u.color })),
    tags: tags.map((t) => ({ id: t.id, name: t.name })),
    groups: board.groups.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      position: g.position,
      contacts: g.contacts.map((c) => ({
        id: c.id,
        groupId: c.groupId,
        position: c.position,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        linkedin: c.linkedin,
        channel: c.preferredChannel,
        stage: c.stage ? toStatus(c.stage) : null,
        followup: c.followup ? toStatus(c.followup) : null,
        problem: c.problem ? toStatus(c.problem) : null,
        priority: c.priority ? toStatus(c.priority) : null,
        owner: c.owner ? { id: c.owner.id, name: c.owner.name, color: c.owner.color } : null,
        interviewDate: c.interviewDate ? c.interviewDate.toISOString().slice(0, 10) : null,
        currentSolution: c.currentSolution,
        nextStep: c.nextStep,
        tags: c.tags.map((ct) => ({ id: ct.tag.id, name: ct.tag.name })),
        notesCount: c._count.notes,
        updatedAt: c.updatedAt.toISOString(),
      })),
    })),
  };

  const contacts = dto.groups.flatMap((g) => g.contacts);
  const interviewed = contacts.filter((c) => c.notesCount > 0);
  const assessed = contacts.filter((c) => c.problem !== null && c.problem.label !== "Not asked");
  const confirmed = assessed.filter((c) => c.problem!.label === "Confirmed");
  const validated = contacts.filter((c) => c.stage?.label === "Validated");

  const tagCounts = new Map<string, number>();
  for (const c of contacts) {
    for (const t of c.tags) tagCounts.set(t.name, (tagCounts.get(t.name) ?? 0) + 1);
  }
  const topNeedEntry = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const stats: BoardStats = {
    interviews: interviewed.length,
    problemPct: assessed.length ? Math.round((confirmed.length / assessed.length) * 100) : 0,
    validatedPct: interviewed.length
      ? Math.round((validated.length / interviewed.length) * 100)
      : 0,
    topNeed: topNeedEntry ? { name: topNeedEntry[0], count: topNeedEntry[1] } : null,
    followupsDue: contacts.filter(
      (c) => c.followup !== null && c.followup.label !== "No follow-up"
    ).length,
  };

  const weekMs = 7 * 24 * 3600 * 1000;
  const monday = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  };
  const thisWeek = monday(new Date());
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(thisWeek.getTime() - (7 - i) * weekMs);
    const count = noteDates.filter(
      (n) => n.interviewDate >= start && n.interviewDate < new Date(start.getTime() + weekMs)
    ).length;
    return { label: start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), count };
  });

  const insights: InsightsData = {
    needs: [...tagCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    funnel: dto.stages.map((s) => ({
      label: s.label,
      color: s.color,
      count: contacts.filter((c) => c.stage?.id === s.id).length,
    })),
    problems: dto.problems.map((s) => ({
      label: s.label,
      color: s.color,
      count: contacts.filter((c) => c.problem?.id === s.id).length,
    })),
    weekly,
    owners: [
      ...dto.users.map((u) => ({
        name: u.name,
        color: u.color,
        count: contacts.filter((c) => c.owner?.id === u.id).length,
      })),
      { name: "Unassigned", color: "#94a3b8", count: contacts.filter((c) => c.owner === null).length },
    ],
  };

  return { dto, contacts, stats, insights };
}
