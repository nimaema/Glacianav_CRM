"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getAppConfig } from "@/lib/app-config";
import { Role } from "@/lib/generated/prisma/enums";

async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Admins only.");
  return session;
}

// The client secret is never stored here — it comes only from MS_CLIENT_SECRET.
const ssoInput = z.object({
  passwordLoginEnabled: z.boolean(),
  microsoftEnabled: z.boolean(),
  microsoftTenantId: z.string().max(200).nullable(),
  microsoftClientId: z.string().max(200).nullable(),
  ssoAllowedDomain: z.string().max(200).nullable(),
  ssoAutoProvision: z.boolean(),
});
export type SsoInput = z.infer<typeof ssoInput>;

export async function updateSsoConfig(input: SsoInput) {
  await assertAdmin();
  const data = ssoInput.parse(input);
  await getAppConfig(); // ensure the singleton exists
  await prisma.appConfig.update({
    where: { id: "singleton" },
    data: {
      passwordLoginEnabled: data.passwordLoginEnabled,
      microsoftEnabled: data.microsoftEnabled,
      microsoftTenantId: data.microsoftTenantId?.trim() || null,
      microsoftClientId: data.microsoftClientId?.trim() || null,
      ssoAllowedDomain: data.ssoAllowedDomain?.trim().toLowerCase() || null,
      ssoAutoProvision: data.ssoAutoProvision,
    },
  });
  revalidatePath("/", "layout");
}

export async function setUserRole(userId: string, role: Role) {
  const me = await assertAdmin();
  z.string().min(1).parse(userId);
  z.enum(Role).parse(role);
  if (userId === me.userId && role !== "ADMIN") {
    throw new Error("You cannot remove your own admin access.");
  }
  if (role === "MEMBER") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (target.role === "ADMIN" && admins <= 1) {
      throw new Error("Keep at least one admin.");
    }
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/", "layout");
}

export async function removeTeamMember(userId: string) {
  const me = await assertAdmin();
  z.string().min(1).parse(userId);
  if (userId === me.userId) throw new Error("You cannot remove yourself.");
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw new Error("Keep at least one admin.");
  }
  // contacts they lead fall back to unassigned (onDelete: SetNull)
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/", "layout");
}
