import { getBoard } from "@/lib/board-data";
import { requireUser } from "@/actions/auth";
import { BoardShell } from "@/components/board/board-shell";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const session = await requireUser();
  const data = await getBoard();
  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[13px] text-muted-foreground">
          No board found. Run: npx tsx prisma/seed.ts
        </p>
      </div>
    );
  }
  return (
    <BoardShell
      board={data.dto}
      stats={data.stats}
      contactCount={data.contacts.length}
      isAdmin={session.role === "ADMIN"}
    />
  );
}
