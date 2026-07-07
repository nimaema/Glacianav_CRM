import { getBoard } from "@/lib/board-data";
import { requireUser } from "@/actions/auth";
import { BoardShell } from "@/components/board/board-shell";
import { EmptyBoardState } from "@/components/board/empty-board-state";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const session = await requireUser();
  const data = await getBoard();
  if (!data) {
    return <EmptyBoardState isAdmin={session.role === "ADMIN"} />;
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
