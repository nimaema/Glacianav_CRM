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
        <div className="flex items-center gap-2.5">
          <span className="size-2 bg-signal" aria-hidden="true" />
          <span className="type-legend text-muted-foreground">Workspace / whole board</span>
        </div>
        <h1 className="type-poster mt-2 text-[clamp(26px,3vw,36px)] text-foreground">Insights</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          What the interviews are telling you, across the whole board.
        </p>
      </header>
      <BoardInsights insights={data.insights} />
    </div>
  );
}
