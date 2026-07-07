"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Mail, BriefcaseBusiness, Smartphone, MessageSquareText } from "lucide-react";
import { updateContactStatus } from "@/actions/board";
import { chipTint, initials, type BoardDTO, type ContactDTO } from "@/lib/board-types";
import { cn } from "@/lib/utils";

const CHANNEL_ICONS = { EMAIL: Mail, LINKEDIN: BriefcaseBusiness, PHONE: Smartphone };

type CardDTO = ContactDTO & { groupColor: string };

export function BoardKanban({
  board,
  onOpenContact,
}: {
  board: BoardDTO;
  onOpenContact: (contact: ContactDTO) => void;
}) {
  const fromProps = useMemo(() => {
    const groupColor = new Map(board.groups.map((g) => [g.id, g.color]));
    return board.groups
      .flatMap((g) => g.contacts)
      .map((c) => ({ ...c, groupColor: groupColor.get(c.groupId) ?? "#64748b" }));
  }, [board.groups]);

  const [contacts, setContacts] = useState<CardDTO[]>(fromProps);
  const [, startTransition] = useTransition();
  useEffect(() => setContacts(fromProps), [fromProps]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const stage = board.stages.find((s) => s.id === destination.droppableId);
    if (!stage) return;
    const card = contacts.find((c) => c.id === draggableId);
    if (!card || card.stage?.id === stage.id) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === draggableId ? { ...c, stage } : c))
    );
    startTransition(() => updateContactStatus(draggableId, "STAGE", stage.id));
  };

  return (
    <div className="flex-1 overflow-x-auto px-6 py-5">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex h-full min-w-max items-stretch gap-3.5 pb-1">
          {board.stages.map((stage) => {
            const cards = contacts.filter((c) => c.stage?.id === stage.id);
            return (
              <section
                key={stage.id}
                aria-label={`${stage.label} column`}
                className="flex max-h-full w-60 shrink-0 flex-col rounded-xl border border-border bg-muted/40"
              >
                <div
                  className="h-1 shrink-0 rounded-t-xl"
                  style={{ backgroundColor: stage.color }}
                />
                <header className="flex items-center gap-2 px-3 pt-2 pb-2.5">
                  <h3 className="text-[11px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">{stage.label}</h3>
                  <span className="font-mono text-[12px] font-semibold text-muted-foreground">
                    {cards.length}
                  </span>
                </header>
                <Droppable droppableId={stage.id}>
                  {(dropProvided, dropSnapshot) => (
                    <div
                      ref={dropProvided.innerRef}
                      {...dropProvided.droppableProps}
                      className={cn(
                        "flex-1 space-y-2 overflow-y-auto rounded-b-xl px-2 pb-2 transition-colors",
                        dropSnapshot.isDraggingOver && "bg-secondary/50"
                      )}
                    >
                      {cards.map((card, i) => (
                        <Draggable key={card.id} draggableId={card.id} index={i}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <KanbanCard
                                contact={card}
                                groupColor={card.groupColor}
                                isDragging={dragSnapshot.isDragging}
                                onOpen={() => onOpenContact(card)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {dropProvided.placeholder}
                      {cards.length === 0 && !dropSnapshot.isDraggingOver && (
                        <p className="px-1.5 pb-1 text-[12px] text-muted-foreground/70">
                          No contacts
                        </p>
                      )}
                    </div>
                  )}
                </Droppable>
              </section>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

function KanbanCard({
  contact,
  groupColor,
  isDragging,
  onOpen,
}: {
  contact: ContactDTO;
  groupColor: string;
  isDragging: boolean;
  onOpen: () => void;
}) {
  const ChannelIcon = contact.channel ? CHANNEL_ICONS[contact.channel] : null;

  return (
    <article
      onClick={onOpen}
      className={cn(
        "relative cursor-pointer rounded-lg border border-border bg-card py-2 pr-2.5 pl-3.5 transition-colors hover:border-ring/50",
        isDragging && "shadow-lg ring-1 ring-ring"
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-lg"
        style={{ backgroundColor: groupColor }}
        title="Segment color"
      />
      <p className="truncate text-[13px] font-semibold text-foreground">{contact.name}</p>
      {contact.company && (
        <p className="truncate text-[11.5px] text-muted-foreground">{contact.company}</p>
      )}

      {contact.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {contact.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="max-w-24 truncate rounded bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium text-secondary-foreground"
            >
              {tag.name}
            </span>
          ))}
          {contact.tags.length > 2 && (
            <span className="text-[10.5px] font-medium text-muted-foreground">
              +{contact.tags.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        {contact.problem && contact.problem.label !== "Not asked" && (
          <span
            className="inline-flex h-[18px] items-center rounded border px-1.5 text-[10px] font-semibold"
            style={chipTint(contact.problem.color)}
            title={`Problem: ${contact.problem.label}`}
          >
            {contact.problem.label}
          </span>
        )}
        {ChannelIcon && (
          <ChannelIcon className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
        )}
        {contact.notesCount > 0 && (
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <MessageSquareText className="size-3" strokeWidth={1.8} />
            <span className="font-mono text-[11px]">{contact.notesCount}</span>
          </span>
        )}
        <span className="flex-1" />
        {contact.followup && contact.followup.label !== "No follow-up" && (
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: contact.followup.color }}
            title={`Follow-up: ${contact.followup.label}`}
          />
        )}
        {contact.owner && (
          <span
            className="flex size-5 items-center justify-center rounded-full text-[8.5px] font-bold text-white"
            style={{ backgroundColor: contact.owner.color }}
            title={contact.owner.name}
          >
            {initials(contact.owner.name)}
          </span>
        )}
      </div>
    </article>
  );
}
