import { requireUser } from "@/actions/auth";
import { getNotifyPrefs } from "@/actions/account";
import { prisma } from "@/lib/prisma";
import { UserSettings } from "@/components/settings/user-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireUser();
  const [prefs, user] = await Promise.all([
    getNotifyPrefs(),
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { name: true, email: true, color: true, role: true },
    }),
  ]);

  return (
    <UserSettings
      name={user.name}
      email={user.email}
      color={user.color}
      role={user.role}
      prefs={prefs}
    />
  );
}
