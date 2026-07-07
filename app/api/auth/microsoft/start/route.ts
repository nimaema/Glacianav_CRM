import { NextResponse } from "next/server";
import { getAppConfig, effectiveMicrosoft, microsoftReady } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const m = effectiveMicrosoft(await getAppConfig());
  if (!microsoftReady(m)) {
    return NextResponse.redirect(new URL("/login?error=sso_off", origin));
  }

  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/microsoft/callback`;
  const tenant = m.tenantId || "organizations";

  const authorize = new URL(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
  );
  authorize.searchParams.set("client_id", m.clientId!);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_mode", "query");
  authorize.searchParams.set("scope", "openid profile email User.Read");
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set("ms_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
