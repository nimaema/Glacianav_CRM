import { getBoard } from "@/lib/board-data";
import { ContactsView } from "@/components/contacts/contacts-view";

export const dynamic = "force-dynamic";

export default async function ContactsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const data = await getBoard();
  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[13px] text-muted-foreground">No board found.</p>
      </div>
    );
  }
  return <ContactsView board={data.dto} initialQuery={q ?? ""} />;
}
