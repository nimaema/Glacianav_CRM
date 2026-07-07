import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "MEMBER";
export type SessionUser = {
  userId: string;
  name: string;
  role: Role;
  color: string;
};

export const SESSION_COOKIE = "crm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const COOKIE = SESSION_COOKIE;
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me"
);
const MAX_AGE = SESSION_MAX_AGE;

export async function encrypt(payload: SessionUser) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function decrypt(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      role: payload.role as Role,
      color: payload.color as string,
    };
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const token = await encrypt(user);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return decrypt(token);
}
