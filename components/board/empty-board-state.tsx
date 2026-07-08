import { bootstrapWorkspace } from "@/actions/board";
import { Button } from "@/components/ui/button";

export function EmptyBoardState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-md border border-border bg-card p-6 text-center">
        <h1 className="type-poster text-[22px] text-foreground">Create your board</h1>
        <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
          This workspace is connected, but the first board has not been created yet.
        </p>
        {isAdmin ? (
          <form action={bootstrapWorkspace} className="mt-4">
            <Button type="submit" className="h-9 px-4 text-[13px] font-semibold">
              Create board
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-[12.5px] text-muted-foreground">
            Ask an admin to create the first board.
          </p>
        )}
      </div>
    </div>
  );
}
