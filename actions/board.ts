"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  StatusColumn,
  ContactChannel,
  NoteType,
  ActivityType,
} from "@/lib/generated/prisma/enums";

import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

const id = z.string().min(1);

// Mutations are attributed to the logged-in user.
async function actorId() {
  const session = await getSession();
  return session?.userId ?? null;
}

// Admin-only guard for board configuration (statuses, groups, team).
async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Only admins can change board configuration.");
  }
}

export async function bootstrapWorkspace() {
  await assertAdmin();
  const existing = await prisma.board.findFirst({ select: { id: true } });
  if (existing) return;

  await prisma.$transaction(async (tx) => {
    await tx.appConfig.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    const board = await tx.board.create({ data: { name: "Customer Validation" } });

    await tx.group.create({
      data: {
        boardId: board.id,
        name: "Leads Inbox",
        color: "#0d9488",
        position: 1,
        isInbox: true,
      },
    });

    await tx.status.createMany({
      data: [
        { boardId: board.id, column: "STAGE", label: "Not Contacted", color: "#64748b", position: 1, isDefault: true },
        { boardId: board.id, column: "STAGE", label: "Reached Out", color: "#2563eb", position: 2 },
        { boardId: board.id, column: "STAGE", label: "Scheduled", color: "#7c3aed", position: 3 },
        { boardId: board.id, column: "STAGE", label: "Interviewed", color: "#b45309", position: 4 },
        { boardId: board.id, column: "STAGE", label: "Validated", color: "#15803d", position: 5 },
        { boardId: board.id, column: "STAGE", label: "Not a Fit", color: "#dc2626", position: 6 },
        { boardId: board.id, column: "FOLLOWUP", label: "No follow-up", color: "#57534e", position: 1, isDefault: true },
        { boardId: board.id, column: "FOLLOWUP", label: "Waiting reply", color: "#b45309", position: 2 },
        { boardId: board.id, column: "FOLLOWUP", label: "Nudge again", color: "#2563eb", position: 3 },
        { boardId: board.id, column: "FOLLOWUP", label: "Send summary", color: "#7c3aed", position: 4 },
        { boardId: board.id, column: "FOLLOWUP", label: "Book next call", color: "#15803d", position: 5 },
        { boardId: board.id, column: "PRIORITY", label: "Low", color: "#64748b", position: 1 },
        { boardId: board.id, column: "PRIORITY", label: "Medium", color: "#b45309", position: 2, isDefault: true },
        { boardId: board.id, column: "PRIORITY", label: "High", color: "#dc2626", position: 3 },
        { boardId: board.id, column: "PROBLEM", label: "Not asked", color: "#64748b", position: 1, isDefault: true },
        { boardId: board.id, column: "PROBLEM", label: "Confirmed", color: "#15803d", position: 2 },
        { boardId: board.id, column: "PROBLEM", label: "Weak signal", color: "#b45309", position: 3 },
        { boardId: board.id, column: "PROBLEM", label: "Rejected", color: "#dc2626", position: 4 },
      ],
    });
  });

  revalidatePath("/", "layout");
}

async function log(contactId: string, type: ActivityType, detail: string) {
  await prisma.activity.create({
    data: { contactId, userId: await actorId(), type, detail },
  });
}

const TEXT_FIELDS = [
  "name",
  "company",
  "email",
  "phone",
  "linkedin",
  "currentSolution",
  "nextStep",
] as const;
type TextField = (typeof TEXT_FIELDS)[number];

const FIELD_LABELS: Record<TextField, string> = {
  name: "Name",
  company: "Company",
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn",
  currentSolution: "Current solution",
  nextStep: "Next step",
};

export async function updateContactStatus(
  contactId: string,
  column: StatusColumn,
  statusId: string
) {
  id.parse(contactId);
  id.parse(statusId);
  const status = await prisma.status.findUniqueOrThrow({ where: { id: statusId } });
  const data =
    column === "STAGE"
      ? { stageId: statusId }
      : column === "FOLLOWUP"
        ? { followupId: statusId }
        : column === "PROBLEM"
          ? { problemId: statusId }
          : { priorityId: statusId };
  await prisma.contact.update({ where: { id: contactId }, data });
  const kind =
    column === "STAGE"
      ? "Stage"
      : column === "FOLLOWUP"
        ? "Follow-up"
        : column === "PROBLEM"
          ? "Problem confirmation"
          : "Priority";
  await log(
    contactId,
    column === "STAGE" ? "STAGE" : "FIELD",
    `${kind} changed to ${status.label}`
  );
  revalidatePath("/", "layout");
}

export async function updateContactText(
  contactId: string,
  field: TextField,
  value: string | null
) {
  id.parse(contactId);
  z.enum(TEXT_FIELDS).parse(field);
  const clean = value === null ? null : z.string().max(500).parse(value).trim() || null;
  if (field === "name" && !clean) return; // a contact keeps its name
  await prisma.contact.update({ where: { id: contactId }, data: { [field]: clean } });
  await log(contactId, "FIELD", clean ? `${FIELD_LABELS[field]} updated` : `${FIELD_LABELS[field]} cleared`);
  revalidatePath("/", "layout");
}

export async function setContactChannel(contactId: string, channel: ContactChannel | null) {
  id.parse(contactId);
  if (channel !== null) z.enum(ContactChannel).parse(channel);
  await prisma.contact.update({
    where: { id: contactId },
    data: { preferredChannel: channel },
  });
  await log(contactId, "FIELD", channel ? `Preferred channel set to ${channel.toLowerCase()}` : "Preferred channel cleared");
  revalidatePath("/", "layout");
}

export async function setContactDate(contactId: string, isoDate: string | null) {
  id.parse(contactId);
  const clean = isoDate ? new Date(z.iso.date().parse(isoDate)) : null;
  await prisma.contact.update({ where: { id: contactId }, data: { interviewDate: clean } });
  await log(contactId, "FIELD", clean ? `Interview date set to ${isoDate}` : "Interview date cleared");
  revalidatePath("/", "layout");
}

export async function setContactOwner(contactId: string, userId: string | null) {
  id.parse(contactId);
  if (userId !== null) id.parse(userId);
  const owner = userId
    ? await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    : null;
  await prisma.contact.update({ where: { id: contactId }, data: { ownerId: userId } });
  await log(contactId, "FIELD", owner ? `Owner set to ${owner.name}` : "Owner unassigned");
  revalidatePath("/", "layout");
}

export async function toggleContactTag(contactId: string, tagId: string, on: boolean) {
  id.parse(contactId);
  id.parse(tagId);
  const tag = await prisma.tag.findUniqueOrThrow({ where: { id: tagId } });
  if (on) {
    await prisma.contactTag.createMany({
      data: [{ contactId, tagId }],
      skipDuplicates: true,
    });
  } else {
    await prisma.contactTag.deleteMany({ where: { contactId, tagId } });
  }
  await log(contactId, "FIELD", `${on ? "Need tagged" : "Need removed"}: ${tag.name}`);
  revalidatePath("/", "layout");
}

export async function createTagAndAssign(contactId: string, name: string) {
  id.parse(contactId);
  const clean = z.string().min(1).max(40).parse(name).trim().toLowerCase();
  const tag = await prisma.tag.upsert({
    where: { name: clean },
    create: { name: clean },
    update: {},
  });
  await prisma.contactTag.createMany({ data: [{ contactId, tagId: tag.id }], skipDuplicates: true });
  await log(contactId, "FIELD", `Need tagged: ${clean}`);
  revalidatePath("/", "layout");
}

export async function createContact(groupId: string, name: string) {
  id.parse(groupId);
  const clean = z.string().min(1).max(120).parse(name).trim();
  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });
  const last = await prisma.contact.findFirst({
    where: { groupId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const defaultStage = await prisma.status.findFirst({
    where: { boardId: group.boardId, column: "STAGE", isDefault: true },
  });
  const contact = await prisma.contact.create({
    data: {
      boardId: group.boardId,
      groupId,
      position: (last?.position ?? 0) + 1,
      name: clean,
      stageId: defaultStage?.id ?? null,
    },
  });
  await log(contact.id, "CREATED", "Contact created");
  revalidatePath("/", "layout");
}

// Drag-and-drop: fractional position write, optional cross-group move
export async function moveContact(contactId: string, toGroupId: string, newPosition: number) {
  id.parse(contactId);
  id.parse(toGroupId);
  z.number().finite().parse(newPosition);
  const contact = await prisma.contact.findUniqueOrThrow({
    where: { id: contactId },
    include: { group: true },
  });
  const toGroup = await prisma.group.findUniqueOrThrow({ where: { id: toGroupId } });
  await prisma.contact.update({
    where: { id: contactId },
    data: { groupId: toGroupId, position: newPosition },
  });
  if (contact.groupId !== toGroupId) {
    await log(contactId, "MOVED", `Moved from ${contact.group.name} to ${toGroup.name}`);
  }
  revalidatePath("/", "layout");
}

export async function createStage(label: string, color: string) {
  await assertAdmin();
  const cleanLabel = z.string().min(1).max(40).parse(label).trim();
  const cleanColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).parse(color);
  const board = await prisma.board.findFirstOrThrow();
  const last = await prisma.status.findFirst({
    where: { boardId: board.id, column: "STAGE" },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.status.create({
    data: {
      boardId: board.id,
      column: "STAGE",
      label: cleanLabel,
      color: cleanColor,
      position: (last?.position ?? 0) + 1,
    },
  });
  revalidatePath("/", "layout");
}

/* ---------- Groups are user-defined ---------- */

export async function createGroup(name: string, color: string) {
  await assertAdmin();
  const cleanName = z.string().min(1).max(60).parse(name).trim();
  const cleanColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).parse(color);
  const board = await prisma.board.findFirstOrThrow();
  const last = await prisma.group.findFirst({
    where: { boardId: board.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.group.create({
    data: {
      boardId: board.id,
      name: cleanName,
      color: cleanColor,
      position: (last?.position ?? 0) + 1,
    },
  });
  revalidatePath("/", "layout");
}

export async function renameGroup(groupId: string, name: string) {
  await assertAdmin();
  id.parse(groupId);
  const clean = z.string().min(1).max(60).parse(name).trim();
  if (!clean) return;
  await prisma.group.update({ where: { id: groupId }, data: { name: clean } });
  revalidatePath("/", "layout");
}

export async function setGroupColor(groupId: string, color: string) {
  await assertAdmin();
  id.parse(groupId);
  const clean = z.string().regex(/^#[0-9a-fA-F]{6}$/).parse(color);
  await prisma.group.update({ where: { id: groupId }, data: { color: clean } });
  revalidatePath("/", "layout");
}

export async function deleteGroup(groupId: string) {
  await assertAdmin();
  id.parse(groupId);
  const count = await prisma.contact.count({ where: { groupId } });
  if (count > 0) throw new Error("Move the contacts out before deleting a group.");
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/", "layout");
}

/* ---------- Item drawer: detail fetch + interview notes ---------- */

const noteInput = z.object({
  type: z.enum(NoteType),
  durationMin: z.number().int().min(1).max(600).nullable(),
  interviewDate: z.iso.date(),
  triggerEvent: z.string().max(2000).nullable(),
  workarounds: z.string().max(2000).nullable(),
  costOfProblem: z.string().max(2000).nullable(),
  quotes: z.string().max(4000).nullable(),
  body: z.string().max(8000).nullable(),
  actionItems: z.string().max(2000).nullable(),
});
export type NoteInput = z.infer<typeof noteInput>;

export async function getContactDetail(contactId: string) {
  id.parse(contactId);
  const [notes, activities] = await Promise.all([
    prisma.validationNote.findMany({
      where: { contactId },
      orderBy: { interviewDate: "desc" },
      include: { author: { select: { name: true, color: true } } },
    }),
    prisma.activity.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true } } },
    }),
  ]);
  return {
    notes: notes.map((n) => ({
      id: n.id,
      type: n.type,
      durationMin: n.durationMin,
      interviewDate: n.interviewDate.toISOString().slice(0, 10),
      triggerEvent: n.triggerEvent,
      workarounds: n.workarounds,
      costOfProblem: n.costOfProblem,
      quotes: n.quotes,
      body: n.body,
      actionItems: n.actionItems,
      author: n.author ? { name: n.author.name, color: n.author.color } : null,
    })),
    activities: activities.map((a) => ({
      id: a.id,
      type: a.type,
      detail: a.detail,
      user: a.user?.name ?? null,
      at: a.createdAt.toISOString(),
    })),
  };
}
export type ContactDetail = Awaited<ReturnType<typeof getContactDetail>>;

export async function createNote(contactId: string, input: NoteInput) {
  id.parse(contactId);
  const data = noteInput.parse(input);
  await prisma.validationNote.create({
    data: {
      contactId,
      authorId: await actorId(),
      type: data.type,
      durationMin: data.durationMin,
      interviewDate: new Date(data.interviewDate),
      triggerEvent: data.triggerEvent,
      workarounds: data.workarounds,
      costOfProblem: data.costOfProblem,
      quotes: data.quotes,
      body: data.body,
      actionItems: data.actionItems,
    },
  });
  await log(contactId, "NOTE", `${data.type.toLowerCase()} note added`);
  revalidatePath("/", "layout");
}

export async function deleteNote(noteId: string) {
  id.parse(noteId);
  const note = await prisma.validationNote.delete({ where: { id: noteId } });
  await log(note.contactId, "NOTE", `${note.type.toLowerCase()} note deleted`);
  revalidatePath("/", "layout");
}

/* ---------- Public intake form ---------- */

const intakeInput = z.object({
  name: z.string().min(1).max(120),
  company: z.string().max(120).nullable(),
  email: z.string().max(200).nullable(),
  groupId: z.string().min(1).nullable(),
  problem: z.string().max(2000).nullable(),
});
export type IntakeInput = z.infer<typeof intakeInput>;

export async function submitIntake(input: IntakeInput) {
  const data = intakeInput.parse(input);
  const board = await prisma.board.findFirstOrThrow();
  const group = data.groupId
    ? await prisma.group.findUniqueOrThrow({ where: { id: data.groupId } })
    : await prisma.group.findFirstOrThrow({
        where: { boardId: board.id },
        orderBy: { position: "asc" },
      });
  const last = await prisma.contact.findFirst({
    where: { groupId: group.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const defaultStage = await prisma.status.findFirst({
    where: { boardId: board.id, column: "STAGE", isDefault: true },
  });
  const contact = await prisma.contact.create({
    data: {
      boardId: board.id,
      groupId: group.id,
      position: (last?.position ?? 0) + 1,
      name: data.name.trim(),
      company: data.company?.trim() || null,
      email: data.email?.trim() || null,
      preferredChannel: data.email ? "EMAIL" : null,
      stageId: defaultStage?.id ?? null,
    },
  });
  if (data.problem?.trim()) {
    await prisma.validationNote.create({
      data: {
        contactId: contact.id,
        type: "SURVEY",
        body: data.problem.trim(),
      },
    });
  }
  await prisma.activity.create({
    data: { contactId: contact.id, type: "CREATED", detail: "Submitted via intake form" },
  });
  revalidatePath("/", "layout");
}

/* ---------- Detailed contact creation (New contact dialog) ---------- */

const contactInput = z.object({
  groupId: z.string().min(1),
  name: z.string().min(1).max(120),
  company: z.string().max(120).nullable(),
  email: z.string().max(200).nullable(),
  channel: z.enum(ContactChannel).nullable(),
});
export type ContactInput = z.infer<typeof contactInput>;

export async function createContactDetailed(input: ContactInput) {
  const data = contactInput.parse(input);
  const group = await prisma.group.findUniqueOrThrow({ where: { id: data.groupId } });
  const last = await prisma.contact.findFirst({
    where: { groupId: data.groupId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const defaultStage = await prisma.status.findFirst({
    where: { boardId: group.boardId, column: "STAGE", isDefault: true },
  });
  const contact = await prisma.contact.create({
    data: {
      boardId: group.boardId,
      groupId: data.groupId,
      position: (last?.position ?? 0) + 1,
      name: data.name.trim(),
      company: data.company?.trim() || null,
      email: data.email?.trim() || null,
      preferredChannel: data.channel,
      stageId: defaultStage?.id ?? null,
    },
  });
  await log(contact.id, "CREATED", "Contact created");
  revalidatePath("/", "layout");
  return contact.id;
}

/* ---------- Generic status management (Settings) ---------- */

export async function createStatus(column: StatusColumn, label: string, color: string) {
  await assertAdmin();
  z.enum(StatusColumn).parse(column);
  const cleanLabel = z.string().min(1).max(40).parse(label).trim();
  const cleanColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).parse(color);
  const board = await prisma.board.findFirstOrThrow();
  const last = await prisma.status.findFirst({
    where: { boardId: board.id, column },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.status.create({
    data: {
      boardId: board.id,
      column,
      label: cleanLabel,
      color: cleanColor,
      position: (last?.position ?? 0) + 1,
    },
  });
  revalidatePath("/", "layout");
}

export async function renameStatus(statusId: string, label: string) {
  await assertAdmin();
  id.parse(statusId);
  const clean = z.string().min(1).max(40).parse(label).trim();
  if (!clean) return;
  await prisma.status.update({ where: { id: statusId }, data: { label: clean } });
  revalidatePath("/", "layout");
}

export async function recolorStatus(statusId: string, color: string) {
  await assertAdmin();
  id.parse(statusId);
  const clean = z.string().regex(/^#[0-9a-fA-F]{6}$/).parse(color);
  await prisma.status.update({ where: { id: statusId }, data: { color: clean } });
  revalidatePath("/", "layout");
}

export async function deleteStatus(statusId: string) {
  await assertAdmin();
  id.parse(statusId);
  const status = await prisma.status.findUniqueOrThrow({ where: { id: statusId } });
  const remaining = await prisma.status.count({
    where: { boardId: status.boardId, column: status.column },
  });
  if (remaining <= 1) throw new Error("Keep at least one option in each column.");
  await prisma.status.delete({ where: { id: statusId } });
  revalidatePath("/", "layout");
}

/* ---------- Team members (Settings) ---------- */

export async function createTeamMember(name: string, email: string, color: string) {
  await assertAdmin();
  const cleanName = z.string().min(1).max(80).parse(name).trim();
  const cleanEmail = z.string().email().max(200).parse(email).trim();
  const cleanColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).parse(color);
  await prisma.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      color: cleanColor,
      role: "MEMBER",
      passwordHash: bcrypt.hashSync("glacianav", 10),
    },
  });
  revalidatePath("/", "layout");
}
