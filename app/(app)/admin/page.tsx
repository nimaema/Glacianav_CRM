import { getBoard } from "@/lib/board-data";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/auth";
import { getAppConfig, microsoftEnvStatus } from "@/lib/app-config";
import { AdminConsole, type SsoState } from "@/components/admin/admin-console";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdmin();
  const [data, users, config] = await Promise.all([
    getBoard(),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        color: true,
        role: true,
        _count: { select: { contacts: true } },
      },
    }),
    getAppConfig(),
  ]);

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[13px] text-muted-foreground">No board found.</p>
      </div>
    );
  }

  const env = microsoftEnvStatus();
  const sso: SsoState = {
    passwordLoginEnabled: config.passwordLoginEnabled,
    microsoftEnabled: config.microsoftEnabled,
    microsoftTenantId: config.microsoftTenantId ?? "",
    microsoftClientId: config.microsoftClientId ?? "",
    ssoAllowedDomain: config.ssoAllowedDomain ?? "",
    ssoAutoProvision: config.ssoAutoProvision,
    env,
  };

  return (
    <AdminConsole
      board={data.dto}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        color: u.color,
        role: u.role,
        contactCount: u._count.contacts,
      }))}
      currentUserId={session.userId}
      sso={sso}
    />
  );
}
