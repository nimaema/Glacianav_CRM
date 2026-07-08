import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const STATUS = {
  slate: "#5b6b78",
  blue: "#33688c",
  violet: "#6d5a8e",
  amber: "#9c6b3f",
  green: "#47704a",
  red: "#c6362c",
  stone: "#7a6f5f",
};

type Channel = "EMAIL" | "LINKEDIN" | "PHONE";

async function main() {
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();

  const nima = await prisma.user.create({
    data: {
      name: "Nima",
      email: "nimaemami31@gmail.com",
      passwordHash: bcrypt.hashSync("glacianav", 10),
      role: "ADMIN",
      color: "#3e7d7b",
    },
  });
  const sara = await prisma.user.create({
    data: {
      name: "Sara",
      email: "sara@glacianav.com",
      passwordHash: bcrypt.hashSync("glacianav", 10),
      role: "MEMBER",
      color: "#6d5a8e",
    },
  });

  const board = await prisma.board.create({ data: { name: "Customer Validation" } });

  const stageRows = [
    { label: "Not Contacted", color: STATUS.slate, isDefault: true },
    { label: "Reached Out", color: STATUS.blue },
    { label: "Scheduled", color: STATUS.violet },
    { label: "Interviewed", color: STATUS.amber },
    { label: "Validated", color: STATUS.green },
    { label: "Not a Fit", color: STATUS.red },
  ];
  const followupRows = [
    { label: "No follow-up", color: STATUS.stone, isDefault: true },
    { label: "Waiting reply", color: STATUS.amber },
    { label: "Nudge again", color: STATUS.blue },
    { label: "Send summary", color: STATUS.violet },
    { label: "Book next call", color: STATUS.green },
  ];
  const priorityRows = [
    { label: "Low", color: STATUS.slate },
    { label: "Medium", color: STATUS.amber, isDefault: true },
    { label: "High", color: STATUS.red },
  ];

  type StatusRow = { id: string; label: string };
  const stages: StatusRow[] = [];
  for (const [i, s] of stageRows.entries()) {
    stages.push(
      await prisma.status.create({
        data: { boardId: board.id, column: "STAGE", position: i + 1, ...s },
      })
    );
  }
  const followups: StatusRow[] = [];
  for (const [i, s] of followupRows.entries()) {
    followups.push(
      await prisma.status.create({
        data: { boardId: board.id, column: "FOLLOWUP", position: i + 1, ...s },
      })
    );
  }
  const priorities: StatusRow[] = [];
  for (const [i, s] of priorityRows.entries()) {
    priorities.push(
      await prisma.status.create({
        data: { boardId: board.id, column: "PRIORITY", position: i + 1, ...s },
      })
    );
  }

  const guides = await prisma.group.create({
    data: { boardId: board.id, name: "Mountain Guides", color: "#3e7d7b", position: 1 },
  });
  const operators = await prisma.group.create({
    data: { boardId: board.id, name: "Tour Operators", color: "#9c6b3f", position: 2 },
  });
  const alpinists = await prisma.group.create({
    data: { boardId: board.id, name: "Independent Alpinists", color: "#46557f", position: 3 },
  });

  const tagNames = [
    "offline maps",
    "crevasse risk data",
    "route planning",
    "weather integration",
    "group tracking",
    "pricing concern",
    "battery life",
    "trust in data",
  ];
  const tags: Record<string, { id: string }> = {};
  for (const name of tagNames) {
    tags[name] = await prisma.tag.create({ data: { name } });
  }

  const stageBy = (label: string) => stages.find((s) => s.label === label)!.id;
  const fuBy = (label: string) => followups.find((s) => s.label === label)!.id;
  const prioBy = (label: string) => priorities.find((s) => s.label === label)!.id;

  const contacts: Array<{
    group: string;
    position: number;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    channel?: Channel;
    owner?: string;
    stage: string;
    followup?: string;
    priority?: string;
    painScore?: number;
    interviewDate?: string;
    currentSolution?: string;
    nextStep?: string;
    tagNames?: string[];
  }> = [
    {
      group: guides.id,
      position: 1,
      name: "Matteo Brunner",
      company: "Alpin Zermatt",
      email: "matteo@alpinzermatt.ch",
      phone: "+41 79 412 8837",
      channel: "EMAIL",
      owner: nima.id,
      stage: "Validated",
      followup: "Send summary",
      priority: "High",
      painScore: 9,
      interviewDate: "2026-06-24",
      currentSolution: "Gaia GPS + paper maps",
      nextStep: "Send pilot agreement",
      tagNames: ["crevasse risk data", "offline maps", "trust in data"],
    },
    {
      group: guides.id,
      position: 2,
      name: "Ingrid Solheim",
      company: "Jotunheimen Guides",
      email: "ingrid@jguides.no",
      phone: "+47 913 44 782",
      channel: "PHONE",
      owner: nima.id,
      stage: "Interviewed",
      followup: "Nudge again",
      priority: "High",
      painScore: 8,
      interviewDate: "2026-06-30",
      currentSolution: "Garmin inReach + local knowledge",
      nextStep: "Follow-up on winter routes",
      tagNames: ["route planning", "weather integration", "offline maps"],
    },
    {
      group: guides.id,
      position: 3,
      name: "Luc Perrin",
      company: "Chamonix Independent",
      linkedin: "linkedin.com/in/lucperrin-cham",
      channel: "LINKEDIN",
      owner: sara.id,
      stage: "Scheduled",
      followup: "Waiting reply",
      priority: "Medium",
      interviewDate: "2026-07-09",
      currentSolution: "FATMAP legacy app",
      nextStep: "Interview Thu 14:00",
      tagNames: ["crevasse risk data"],
    },
    {
      group: guides.id,
      position: 4,
      name: "Aiga Ozolina",
      company: "Tatra Mountain School",
      linkedin: "linkedin.com/in/aigaozolina",
      channel: "LINKEDIN",
      stage: "Reached Out",
      followup: "Nudge again",
      priority: "Medium",
      nextStep: "Second email, mention Matteo",
    },
    {
      group: operators.id,
      position: 1,
      name: "Hannah Kirkwood",
      company: "Arctic Trails Ltd",
      email: "hannah@arctictrails.is",
      channel: "EMAIL",
      owner: nima.id,
      stage: "Interviewed",
      followup: "Book next call",
      priority: "High",
      painScore: 7,
      interviewDate: "2026-07-01",
      currentSolution: "Spreadsheets + WhatsApp for groups",
      nextStep: "Demo group tracking",
      tagNames: ["group tracking", "weather integration"],
    },
    {
      group: operators.id,
      position: 2,
      name: "Diego Fernandez",
      company: "Patagonia Verticals",
      email: "diego@pverticals.ar",
      channel: "EMAIL",
      owner: sara.id,
      stage: "Interviewed",
      followup: "No follow-up",
      priority: "Low",
      painScore: 4,
      interviewDate: "2026-06-19",
      currentSolution: "In-house route sheets",
      nextStep: "Park until season starts",
      tagNames: ["pricing concern"],
    },
    {
      group: operators.id,
      position: 3,
      name: "Yuki Hamasaki",
      company: "Hokkaido Powder Tours",
      stage: "Not Contacted",
      priority: "Medium",
    },
    {
      group: alpinists.id,
      position: 1,
      name: "Tomas Krejci",
      phone: "+420 605 118 220",
      channel: "PHONE",
      owner: nima.id,
      stage: "Validated",
      followup: "No follow-up",
      priority: "Medium",
      painScore: 8,
      interviewDate: "2026-06-12",
      currentSolution: "Caltopo + phone GPS",
      nextStep: "Beta invite sent",
      tagNames: ["offline maps", "battery life"],
    },
    {
      group: alpinists.id,
      position: 2,
      name: "Elif Aydin",
      stage: "Not a Fit",
      priority: "Low",
      painScore: 2,
      interviewDate: "2026-06-15",
      currentSolution: "Guided trips only, no self-nav",
      tagNames: ["trust in data"],
    },
  ];

  for (const c of contacts) {
    const created = await prisma.contact.create({
      data: {
        boardId: board.id,
        groupId: c.group,
        position: c.position,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        linkedin: c.linkedin,
        preferredChannel: c.channel,
        ownerId: c.owner,
        stageId: stageBy(c.stage),
        followupId: c.followup ? fuBy(c.followup) : null,
        priorityId: c.priority ? prioBy(c.priority) : null,
        painScore: c.painScore,
        interviewDate: c.interviewDate ? new Date(c.interviewDate) : null,
        currentSolution: c.currentSolution,
        nextStep: c.nextStep,
        tags: c.tagNames
          ? { create: c.tagNames.map((n) => ({ tagId: tags[n].id })) }
          : undefined,
      },
    });

    if (c.painScore && c.painScore >= 7) {
      await prisma.validationNote.create({
        data: {
          contactId: created.id,
          authorId: c.owner ?? nima.id,
          interviewDate: c.interviewDate ? new Date(c.interviewDate) : new Date(),
          triggerEvent: "Near-miss or costly detour on a glacier route this season",
          workarounds: c.currentSolution,
          costOfProblem: "2-4 hours of route re-planning per trip",
          quotes: "I do not trust any app on the icefall, I trust my eyes. Show me why yours is different.",
          body: "Strong pain around static map data. Wants live-ish crevasse overlays with provenance.",
          actionItems: c.nextStep,
        },
      });
    }
  }

  const counts = {
    users: await prisma.user.count(),
    statuses: await prisma.status.count(),
    groups: await prisma.group.count(),
    contacts: await prisma.contact.count(),
    notes: await prisma.validationNote.count(),
    tags: await prisma.tag.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
