import { getBoard } from "@/lib/board-data";
import { CalendarView } from "@/components/calendar/calendar-view";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const data = await getBoard();
  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[13px] text-muted-foreground">No board found.</p>
      </div>
    );
  }
  return <CalendarView board={data.dto} />;
}
