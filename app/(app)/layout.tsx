import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TopNav } from "@/components/shell/top-nav";
import { AppSidebar } from "@/components/shell/app-sidebar";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopNav session={session} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar session={session} />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
