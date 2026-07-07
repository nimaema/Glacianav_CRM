"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/session";
import { DEFAULT_NOTIFY, type NotifyPrefs } from "@/lib/notify";

export async function getNotifyPrefs(): Promise<NotifyPrefs> {
  const session = await getSession();
  if (!session) return DEFAULT_NOTIFY;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { notifyPrefs: true },
  });
  return { ...DEFAULT_NOTIFY, ...((user?.notifyPrefs as Partial<NotifyPrefs>) ?? {}) };
}

export async function updateProfile(name: string, color: string) {
  const session = await getSession();
  if (!session) return;
  const cleanName = z.string().min(1).max(80).parse(name).trim();
  const cleanColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).parse(color);
  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name: cleanName, color: cleanColor },
  });
  // refresh the session so the sidebar/nav reflect the new name + color
  await createSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    color: user.color,
  });
  revalidatePath("/", "layout");
}

export async function updateNotifyPrefs(prefs: NotifyPrefs) {
  const session = await getSession();
  if (!session) return;
  const clean: NotifyPrefs = {
    staleDays: z.number().int().min(1).max(90).parse(prefs.staleDays),
    interviews: Boolean(prefs.interviews),
    followups: Boolean(prefs.followups),
    stale: Boolean(prefs.stale),
  };
  await prisma.user.update({
    where: { id: session.userId },
    data: { notifyPrefs: clean },
  });
  revalidatePath("/", "layout");
}
