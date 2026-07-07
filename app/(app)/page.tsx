import { requireUser } from "@/actions/auth";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { MemberDashboard } from "@/components/dashboard/member-dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireUser();
  if (session.role === "ADMIN") {
    return <AdminDashboard name={session.name} />;
  }
  return <MemberDashboard userId={session.userId} name={session.name} />;
}
