import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAppConfig, effectiveMicrosoft, microsoftReady } from "@/lib/app-config";
import { publicOrigin } from "@/lib/public-origin";
import { encrypt, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export const dynamic = "force-dynamic";

const PALETTE = ["#0051d5", "#15803d", "#b45309", "#7c3aed", "#0e7490", "#be123c"];

function fail(origin: string, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, origin));
}

async function logMicrosoftError(label: string, res: Response) {
  let detail = "";
  try {
    const body = (await res.json()) as { error?: string; error_description?: string };
    detail = [body.error, body.error_description].filter(Boolean).join(": ");
  } catch {
    detail = await res.text().catch(() => "");
  }
  console.error(`[microsoft-sso] ${label} failed`, {
    status: res.status,
    statusText: res.statusText,
    detail: detail.slice(0, 600),
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = publicOrigin(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const cookieState = store.get("ms_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail(origin, "sso_state");
  }

  const m = effectiveMicrosoft(await getAppConfig());
  if (!microsoftReady(m)) return fail(origin, "sso_off");
  const tenant = m.tenantId || "organizations";
  const redirectUri = `${origin}/api/auth/microsoft/callback`;

  // Exchange the authorization code for tokens.
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: m.clientId!,
        client_secret: m.secret!,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "openid profile email User.Read",
      }),
    }
  );
  if (!tokenRes.ok) {
    await logMicrosoftError("token exchange", tokenRes);
    return fail(origin, "sso_token");
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    console.error("[microsoft-sso] token exchange returned no access token");
    return fail(origin, "sso_token");
  }

  // Identify the user via Microsoft Graph.
  const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!meRes.ok) {
    await logMicrosoftError("profile request", meRes);
    return fail(origin, "sso_profile");
  }
  const me = (await meRes.json()) as {
    mail?: string;
    userPrincipalName?: string;
    displayName?: string;
  };
  const email = (me.mail || me.userPrincipalName || "").toLowerCase();
  const name = me.displayName || email.split("@")[0];
  if (!email) return fail(origin, "sso_profile");

  if (m.allowedDomain && !email.endsWith(`@${m.allowedDomain}`)) {
    return fail(origin, "sso_domain");
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    if (!m.autoProvision) return fail(origin, "sso_nouser");
    user = await prisma.user.create({
      data: {
        name,
        email,
        role: "MEMBER",
        passwordHash: "sso-account-no-password",
        color: PALETTE[email.length % PALETTE.length],
      },
    });
  }

  const token = await encrypt({
    userId: user.id,
    name: user.name,
    role: user.role,
    color: user.color,
  });
  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  res.cookies.delete("ms_oauth_state");
  return res;
}
