"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DraggableProvided,
} from "@hello-pangea/dnd";
import {
  ChevronDown,
  Plus,
  GripVertical,
  PanelRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  createContact,
  createGroup,
  createTagAndAssign,
  deleteGroup,
  moveContact,
  renameGroup,
  setContactChannel,
  setContactDate,
  setContactOwner,
  setGroupColor,
  toggleContactTag,
  updateContactStatus,
  updateContactText,
} from "@/actions/board";
import { StatusPill } from "@/components/board/status-pill";
import { TagsCell } from "@/components/board/tags-cell";
import { StageDock } from "@/components/board/stage-dock";
import {
  ChannelCell,
  DateCell,
  NotesCell,
  OwnerCell,
  TextCell,
} from "@/components/board/cells";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { STATUS_COLORS } from "@/lib/status-colors";
import { COLUMN_DEFS, gridTemplate, type ColumnKey } from "@/lib/board-columns";
import type { BoardDTO, ContactDTO, GroupDTO } from "@/lib/board-types";
import { cn } from "@/lib/utils";

export function BoardTable({
  board,
  onOpenContact,
  visibleColumns,
  frozen = false,
  isAdmin,
}: {
  board: BoardDTO;
  onOpenContact: (contact: ContactDTO) => void;
  visibleColumns: ColumnKey[];
  frozen?: boolean;
  isAdmin: boolean;
}) {
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [groups, setGroups] = useState(board.groups);
  const [, startTransition] = useTransition();
  useEffect(() => setGroups(board.groups), [board.groups]);

  const allContacts = useMemo(() => groups.flatMap((g) => g.contacts), [groups]);
  const template = gridTemplate(visibleColumns);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    const next = groups.map((g) => ({ ...g, contacts: [...g.contacts] }));
    const from = next.find((g) => g.id === source.droppableId);
    const to = next.find((g) => g.id === destination.droppableId);
    if (!from || !to) return;

    const [moved] = from.contacts.splice(source.index, 1);
    const prevPos = to.contacts[destination.index - 1]?.position;
    const nextPos = to.contacts[destination.index]?.position;
    const newPosition =
      prevPos === undefined && nextPos === undefined
        ? 1
        : prevPos === undefined
          ? nextPos! - 1
          : nextPos === undefined
            ? prevPos + 1
            : (prevPos + nextPos) / 2;

    to.contacts.splice(destination.index, 0, {
      ...moved,
      groupId: to.id,
      position: newPosition,
    });

    setGroups(next);
    startTransition(() => moveContact(draggableId, to.id, newPosition));
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto px-6 pt-5 pb-24">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="min-w-max space-y-7">
            {groups.map((group) => (
              <BoardGroup
                key={group.id}
                group={group}
                board={board}
                stageFilter={stageFilter}
                onOpenContact={onOpenContact}
                visibleColumns={visibleColumns}
                template={template}
                frozen={frozen}
                isAdmin={isAdmin}
              />
            ))}
            {isAdmin && <AddGroup />}
          </div>
        </DragDropContext>
      </div>
      <StageDock
        stages={board.stages}
        contacts={allContacts}
        activeStageId={stageFilter}
        onSelect={setStageFilter}
        isAdmin={isAdmin}
      />
    </div>
  );
}

function BoardGroup({
  group,
  board,
  stageFilter,
  onOpenContact,
  visibleColumns,
  template,
  frozen,
  isAdmin,
}: {
  group: GroupDTO;
  board: BoardDTO;
  stageFilter: string | null;
  onOpenContact: (contact: ContactDTO) => void;
  visibleColumns: ColumnKey[];
  template: string;
  frozen: boolean;
  isAdmin: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const filtered = stageFilter
    ? group.contacts.filter((c) => c.stage?.id === stageFilter)
    : group.contacts;
  const dndDisabled = !!stageFilter || frozen;
  const visibleDefs = COLUMN_DEFS.filter((c) => visibleColumns.includes(c.key));

  return (
    <section>
      <GroupHeader
        group={group}
        count={filtered.length}
        total={group.contacts.length}
        filtered={!!stageFilter}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        isAdmin={isAdmin}
      />

      {/* no overflow-hidden on this wrapper — it would break the sticky first column */}
      {!collapsed && (
        <div className="border border-border bg-card">
          <div className="grid border-b border-border bg-secondary" style={{ gridTemplateColumns: template }}>
            <div className="type-legend sticky left-0 z-[5] bg-secondary px-2 py-2 pl-3.5 text-muted-foreground">
              Contact
            </div>
            {visibleDefs.map((col) => (
              <div
                key={col.key}
                className="type-legend border-l border-border/60 px-2 py-2 text-muted-foreground"
              >
                {col.label}
              </div>
            ))}
          </div>

          <Droppable droppableId={group.id} isDropDisabled={dndDisabled}>
            {(dropProvided) => (
              <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                {filtered.map((contact, i) => (
                  <Draggable
                    key={contact.id}
                    draggableId={contact.id}
                    index={i}
                    isDragDisabled={dndDisabled}
                  >
                    {(dragProvided, snapshot) => (
                      <BoardRow
                        contact={contact}
                        group={group}
                        board={board}
                        provided={dragProvided}
                        isDragging={snapshot.isDragging}
                        onOpen={() => onOpenContact(contact)}
                        visibleColumns={visibleColumns}
                        template={template}
                      />
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          {filtered.length === 0 && (
            <p className="px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
              {stageFilter ? "No contacts in this stage." : "No contacts yet."}
            </p>
          )}

          <AddContactRow groupId={group.id} groupColor={group.color} />
        </div>
      )}
    </section>
  );
}

function GroupHeader({
  group,
  count,
  total,
  filtered,
  collapsed,
  onToggle,
  isAdmin,
}: {
  group: GroupDTO;
  count: number;
  total: number;
  filtered: boolean;
  collapsed: boolean;
  onToggle: () => void;
  isAdmin: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(group.name);
  const [, startTransition] = useTransition();

  const saveRename = () => {
    const clean = draft.trim();
    setRenaming(false);
    if (clean && clean !== group.name) startTransition(() => renameGroup(group.id, clean));
  };

  return (
    <div className="group/header mb-1.5 flex items-center gap-1.5">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-1 py-0.5 transition-colors hover:bg-secondary"
        aria-expanded={!collapsed}
      >
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
          strokeWidth={2.5}
        />
        {/* map-legend swatch carries the group color; the name stays ink */}
        <span className="size-3 shrink-0" style={{ backgroundColor: group.color }} aria-hidden="true" />
        {renaming ? null : (
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">{group.name}</h2>
        )}
      </button>
      {renaming && (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveRename();
            if (e.key === "Escape") setRenaming(false);
          }}
          className="h-7 border border-ring bg-background px-2 text-[14px] font-bold text-foreground outline-none"
        />
      )}
      <span className="font-mono text-[12px] font-medium tabular-nums text-muted-foreground">
        {count}
        {filtered && ` of ${total}`}
      </span>

      {isAdmin && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={`Group options for ${group.name}`}
            className="rounded p-1 text-muted-foreground/0 transition-colors group-hover/header:text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="size-4" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem
            onSelect={() => {
              setDraft(group.name);
              setRenaming(true);
            }}
            className="gap-2 text-[13px]"
          >
            <Pencil className="size-3.5" /> Rename group
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="grid grid-cols-5 gap-1.5 px-2 py-1.5">
            {Object.values(STATUS_COLORS).map((hex) => (
              <button
                key={hex}
                onClick={() => startTransition(() => setGroupColor(group.id, hex))}
                aria-label={`Group color ${hex}`}
                className={cn(
                  "size-6 rounded-md transition-transform hover:scale-110",
                  group.color === hex && "ring-2 ring-ring ring-offset-1"
                )}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={total > 0}
            onSelect={() => startTransition(() => deleteGroup(group.id))}
            variant="destructive"
            className="gap-2 text-[13px]"
          >
            <Trash2 className="size-3.5" />
            {total > 0 ? "Delete (move contacts first)" : "Delete group"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      )}
    </div>
  );
}

function AddGroup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(STATUS_COLORS.teal);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createGroup(name.trim(), color);
      setName("");
      setOpen(false);
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Plus className="size-4" strokeWidth={2.2} />
          Add group
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <p className="mb-2 text-[12px] font-semibold text-foreground">New group</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Group name, e.g. Ski Schools"
          className="mb-2.5 h-8 w-full rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:border-ring"
        />
        <div className="mb-3 grid grid-cols-5 gap-1.5">
          {Object.values(STATUS_COLORS).map((hex) => (
            <button
              key={hex}
              onClick={() => setColor(hex)}
              aria-label={`Color ${hex}`}
              className={cn(
                "size-7 rounded-md transition-transform hover:scale-110",
                color === hex && "ring-2 ring-ring ring-offset-2"
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <Button
          onClick={submit}
          disabled={!name.trim() || pending}
          className="h-7 w-full text-[12.5px] font-semibold"
        >
          {pending ? "Adding group" : "Add group"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function BoardRow({
  contact,
  group,
  board,
  provided,
  isDragging,
  onOpen,
  visibleColumns,
  template,
}: {
  contact: ContactDTO;
  group: GroupDTO;
  board: BoardDTO;
  provided: DraggableProvided;
  isDragging: boolean;
  onOpen: () => void;
  visibleColumns: ColumnKey[];
  template: string;
}) {
  const [, startTransition] = useTransition();
  const act = (fn: () => Promise<void>) => startTransition(() => fn());

  const cells: Record<ColumnKey, React.ReactNode> = {
    stage: (
      <StatusPill
        value={contact.stage}
        options={board.stages}
        onChange={(o) => act(() => updateContactStatus(contact.id, "STAGE", o.id))}
        label={`Stage for ${contact.name}`}
        placeholder="Set stage"
      />
    ),
    problem: (
      <StatusPill
        value={contact.problem}
        options={board.problems}
        onChange={(o) => act(() => updateContactStatus(contact.id, "PROBLEM", o.id))}
        label={`Problem confirmation for ${contact.name}`}
        placeholder="Not asked"
      />
    ),
    needs: (
      <TagsCell
        value={contact.tags}
        allTags={board.tags}
        onToggle={(tagId, on) => act(() => toggleContactTag(contact.id, tagId, on))}
        onCreate={(name) => act(() => createTagAndAssign(contact.id, name))}
      />
    ),
    channel: (
      <ChannelCell
        value={contact.channel}
        onSave={(v) => act(() => setContactChannel(contact.id, v))}
      />
    ),
    solution: (
      <TextCell
        value={contact.currentSolution}
        onSave={(v) => act(() => updateContactText(contact.id, "currentSolution", v))}
        placeholder="Add solution"
      />
    ),
    followup: (
      <StatusPill
        value={contact.followup}
        options={board.followups}
        onChange={(o) => act(() => updateContactStatus(contact.id, "FOLLOWUP", o.id))}
        label={`Follow-up for ${contact.name}`}
        placeholder="Set follow-up"
      />
    ),
    owner: (
      <OwnerCell
        value={contact.owner}
        users={board.users}
        onSave={(userId) => act(() => setContactOwner(contact.id, userId))}
      />
    ),
    interview: (
      <DateCell
        value={contact.interviewDate}
        onSave={(v) => act(() => setContactDate(contact.id, v))}
      />
    ),
    priority: (
      <StatusPill
        value={contact.priority}
        options={board.priorities}
        onChange={(o) => act(() => updateContactStatus(contact.id, "PRIORITY", o.id))}
        label={`Priority for ${contact.name}`}
        placeholder="Set"
      />
    ),
    next: (
      <TextCell
        value={contact.nextStep}
        onSave={(v) => act(() => updateContactText(contact.id, "nextStep", v))}
        placeholder="Add next step"
      />
    ),
    notes: <NotesCell count={contact.notesCount} />,
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={cn(
        "group grid items-center border-b border-border/70 bg-card last:border-b-0 hover:bg-secondary",
        isDragging && "border-b-0 ring-1 ring-ring"
      )}
      style={{ ...provided.draggableProps.style, gridTemplateColumns: template }}
    >
      <div className="relative flex h-10 items-center gap-1 self-stretch bg-card pr-1 pl-2 group-hover:bg-secondary sticky left-0 z-[5]">
        <span
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ backgroundColor: group.color }}
        />
        <span
          {...provided.dragHandleProps}
          aria-label={`Drag ${contact.name}`}
          className="cursor-grab rounded p-0.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60 hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <TextCell
            strong
            value={contact.name}
            onSave={(v) => v && act(() => updateContactText(contact.id, "name", v))}
          />
        </div>
        {contact.company && (
          <span className="max-w-20 truncate text-[11px] text-muted-foreground">
            {contact.company}
          </span>
        )}
        <button
          onClick={onOpen}
          aria-label={`Open ${contact.name}`}
          className="rounded p-1 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:bg-muted hover:text-primary"
        >
          <PanelRight className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      {COLUMN_DEFS.filter((c) => visibleColumns.includes(c.key)).map((col) => (
        <div
          key={col.key}
          className={cn(
            "flex h-10 items-center self-stretch border-l border-border/60 px-2",
            (col.key === "needs" || col.key === "solution" || col.key === "next" || col.key === "interview") &&
              "px-1"
          )}
        >
          {cells[col.key]}
        </div>
      ))}
    </div>
  );
}

function AddContactRow({ groupId, groupColor }: { groupId: string; groupColor: string }) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const clean = name.trim();
    if (!clean) return;
    setName("");
    startTransition(() => createContact(groupId, clean));
  };

  return (
    <div className="relative flex h-10 items-center gap-2 border-t border-border/70 pl-3.5">
      <span
        className="absolute inset-y-0 left-0 w-[3px] opacity-40"
        style={{ backgroundColor: groupColor }}
      />
      <Plus className="size-3.5 text-muted-foreground" strokeWidth={2.2} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={pending ? "Adding contact" : "Add contact, press Enter"}
        aria-label="Add contact"
        className="h-full w-72 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );
}
