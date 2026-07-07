import { getBoard } from "@/lib/board-data";
import { BoardInsights } from "@/components/board/board-insights";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const data = await getBoard();
  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[13px] text-muted-foreground">No board found.</p>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border px-8 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Insights</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          What the interviews are telling you, across the whole board.
        </p>
      </header>
      <BoardInsights insights={data.insights} />
    </div>
  );
}
