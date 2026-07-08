import { getBoard } from "@/lib/board-data";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/auth";
import { getAppConfig, microsoftEnvStatus } from "@/lib/app-config";
import { AdminConsole, type SsoState } from "@/components/admin/admin-console";
import { EmptyBoardState } from "@/components/board/empty-board-state";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdmin();
  const [data, users, boards, config] = await Promise.all([
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
    prisma.board.findMany({
      orderBy: { name: "asc" },
      include: {
        statuses: { orderBy: { position: "asc" } },
        groups: {
          orderBy: { position: "asc" },
          include: { _count: { select: { contacts: true } } },
        },
        _count: { select: { contacts: true, groups: true } },
      },
    }),
    getAppConfig(),
  ]);

  if (!data) {
    return <EmptyBoardState isAdmin />;
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
      boards={boards.map((b) => ({
        id: b.id,
        name: b.name,
        contactCount: b._count.contacts,
        groupCount: b._count.groups,
        stages: b.statuses.filter((s) => s.column === "STAGE"),
        followups: b.statuses.filter((s) => s.column === "FOLLOWUP"),
        problems: b.statuses.filter((s) => s.column === "PROBLEM"),
        priorities: b.statuses.filter((s) => s.column === "PRIORITY"),
        groups: b.groups.map((g) => ({
          id: g.id,
          name: g.name,
          color: g.color,
          contactCount: g._count.contacts,
        })),
      }))}
      currentUserId={session.userId}
      sso={sso}
    />
  );
}
