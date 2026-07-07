import { prisma } from "@/lib/prisma";

// Single-row workspace config. Reads (and lazily creates) the "singleton" row.
export async function getAppConfig() {
  const existing = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.appConfig.create({ data: { id: "singleton" } });
}

type ConfigLike = {
  microsoftEnabled: boolean;
  microsoftTenantId: string | null;
  microsoftClientId: string | null;
  ssoAllowedDomain: string | null;
  ssoAutoProvision: boolean;
};

// Effective Microsoft SSO settings. Environment variables win over the DB, and
// the client secret ONLY ever comes from the environment (MS_CLIENT_SECRET).
export function effectiveMicrosoft(c: ConfigLike) {
  const env = process.env;
  return {
    enabled: env.MS_ENABLED === "true" || c.microsoftEnabled,
    tenantId: env.MS_TENANT_ID || c.microsoftTenantId || null,
    clientId: env.MS_CLIENT_ID || c.microsoftClientId || null,
    secret: env.MS_CLIENT_SECRET || null,
    allowedDomain: (env.MS_ALLOWED_DOMAIN || c.ssoAllowedDomain || null)?.toLowerCase() ?? null,
    autoProvision: c.ssoAutoProvision,
  };
}

export type EffectiveMicrosoft = ReturnType<typeof effectiveMicrosoft>;

export function microsoftReady(m: EffectiveMicrosoft) {
  return Boolean(m.enabled && m.tenantId && m.clientId && m.secret);
}

// Which fields the environment is providing (so the admin UI can show it).
export function microsoftEnvStatus() {
  const env = process.env;
  return {
    secret: Boolean(env.MS_CLIENT_SECRET),
    tenantId: Boolean(env.MS_TENANT_ID),
    clientId: Boolean(env.MS_CLIENT_ID),
    enabled: env.MS_ENABLED === "true",
    allowedDomain: Boolean(env.MS_ALLOWED_DOMAIN),
  };
}

// Safe subset for the (public) login page — no secrets.
export async function getPublicAuthConfig() {
  const c = await getAppConfig();
  return {
    passwordLoginEnabled: c.passwordLoginEnabled,
    microsoftEnabled: microsoftReady(effectiveMicrosoft(c)),
  };
}
