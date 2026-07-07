"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession, type SessionUser } from "@/lib/session";

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(_prev: unknown, formData: FormData) {
  const parsed = loginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
    return { error: "Those credentials do not match." };
  }

  await createSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    color: user.color,
  });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// Session helpers for pages/actions (kept here so callers import from one place).
export async function currentUser(): Promise<SessionUser | null> {
  return getSession();
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireUser();
  if (session.role !== "ADMIN") redirect("/");
  return session;
}
