"use client";

import { useEffect, useState, useTransition } from "react";
import {
  MessagesSquare,
  Presentation,
  ClipboardList,
  MessageCircle,
  Plus,
  Flag,
  Pencil,
  ArrowRightLeft,
  Trash2,
  Clock,
  Quote,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/board/status-pill";
import { ChannelCell, DateCell, OwnerCell, TextCell } from "@/components/board/cells";
import {
  createNote,
  deleteNote,
  getContactDetail,
  setContactChannel,
  setContactDate,
  setContactOwner,
  updateContactStatus,
  updateContactText,
  type ContactDetail,
  type NoteInput,
} from "@/actions/board";
import type { BoardDTO, ContactDTO } from "@/lib/board-types";
import { cn } from "@/lib/utils";

const NOTE_TYPES = [
  { key: "INTERVIEW", label: "Interview", icon: MessagesSquare },
  { key: "DEMO", label: "Demo", icon: Presentation },
  { key: "SURVEY", label: "Survey", icon: ClipboardList },
  { key: "CHAT", label: "Casual chat", icon: MessageCircle },
] as const;

const ACTIVITY_ICONS = {
  CREATED: Plus,
  STAGE: Flag,
  FIELD: Pencil,
  NOTE: MessagesSquare,
  MOVED: ArrowRightLeft,
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ContactDrawer({
  contact,
  board,
  onClose,
}: {
  contact: ContactDTO | null;
  board: BoardDTO;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [tab, setTab] = useState<"notes" | "activity">("notes");
  const [, startTransition] = useTransition();
  const act = (fn: () => Promise<void>) => startTransition(() => fn());

  const refetch = (contactId: string) =>
    getContactDetail(contactId).then(setDetail);

  useEffect(() => {
    setDetail(null);
    setTab("notes");
    if (contact) refetch(contact.id);
  }, [contact?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!contact) return <Sheet open={false}>{null}</Sheet>;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <SheetTitle className="truncate text-[17px] font-bold tracking-tight">
                {contact.name}
              </SheetTitle>
              {contact.company && (
                <p className="truncate text-[12.5px] text-muted-foreground">{contact.company}</p>
              )}
            </div>
            <StatusPill
              value={contact.stage}
              options={board.stages}
              onChange={(o) => act(() => updateContactStatus(contact.id, "STAGE", o.id))}
              label={`Stage for ${contact.name}`}
              placeholder="Set stage"
            />
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-b border-border px-5 py-4">
            <Field label="Preferred channel">
              <ChannelCell
                value={contact.channel}
                onSave={(v) => act(() => setContactChannel(contact.id, v))}
              />
            </Field>
            <Field label="Lead">
              <OwnerCell
                value={contact.owner}
                users={board.users}
                onSave={(v) => act(() => setContactOwner(contact.id, v))}
              />
            </Field>
            <Field label="Email">
              <TextCell
                value={contact.email}
                onSave={(v) => act(() => updateContactText(contact.id, "email", v))}
                placeholder="Add email"
              />
            </Field>
            <Field label="Phone">
              <TextCell
                value={contact.phone}
                onSave={(v) => act(() => updateContactText(contact.id, "phone", v))}
                placeholder="Add phone"
              />
            </Field>
            <Field label="LinkedIn">
              <TextCell
                value={contact.linkedin}
                onSave={(v) => act(() => updateContactText(contact.id, "linkedin", v))}
                placeholder="Add profile URL"
              />
            </Field>
            <Field label="Interview date">
              <DateCell
                value={contact.interviewDate}
                onSave={(v) => act(() => setContactDate(contact.id, v))}
              />
            </Field>
            <Field label="Problem">
              <StatusPill
                value={contact.problem}
                options={board.problems}
                onChange={(o) => act(() => updateContactStatus(contact.id, "PROBLEM", o.id))}
                label={`Problem confirmation for ${contact.name}`}
                placeholder="Not asked"
              />
            </Field>
            <Field label="Follow-up">
              <StatusPill
                value={contact.followup}
                options={board.followups}
                onChange={(o) => act(() => updateContactStatus(contact.id, "FOLLOWUP", o.id))}
                label={`Follow-up for ${contact.name}`}
                placeholder="Set follow-up"
              />
            </Field>
          </div>

          <div className="flex items-center gap-1 border-b border-border px-5 pt-3">
            {(["notes", "activity"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "border-b-2 px-2.5 pb-2 text-[13px] capitalize transition-colors",
                  tab === t
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent font-medium text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "notes" ? `Interview notes (${detail?.notes.length ?? contact.notesCount})` : "Activity"}
              </button>
            ))}
          </div>

          {tab === "notes" ? (
            <div className="space-y-3 px-5 py-4">
              <NoteForm
                onSubmit={(input) =>
                  act(async () => {
                    await createNote(contact.id, input);
                    await refetch(contact.id);
                  })
                }
              />
              {detail === null && (
                <p className="text-[12.5px] text-muted-foreground">Loading notes…</p>
              )}
              {detail?.notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={() =>
                    act(async () => {
                      await deleteNote(note.id);
                      await refetch(contact.id);
                    })
                  }
                />
              ))}
              {detail?.notes.length === 0 && (
                <p className="pt-1 text-[12.5px] text-muted-foreground">
                  No interviews logged yet. Capture the first one above.
                </p>
              )}
            </div>
          ) : (
            <div className="px-5 py-4">
              {detail === null && (
                <p className="text-[12.5px] text-muted-foreground">Loading activity…</p>
              )}
              <ol className="space-y-0">
                {detail?.activities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type];
                  return (
                    <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                          <Icon className="size-3 text-secondary-foreground" strokeWidth={2.2} />
                        </span>
                        <span className="w-px flex-1 bg-border" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[12.5px] text-foreground">{a.detail}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {a.user ? `${a.user} · ` : ""}
                          {timeAgo(a.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="shrink-0 text-[12px] text-muted-foreground">{label}</span>
      <div className="flex min-w-0 justify-end">{children}</div>
    </div>
  );
}

/* ---------- structured interview note form ---------- */

const TEXT_FIELDS: Array<{ key: keyof NoteInput; label: string; placeholder: string }> = [
  { key: "triggerEvent", label: "Trigger event", placeholder: "What pushed them to look for a solution?" },
  { key: "workarounds", label: "Current workarounds", placeholder: "How do they cope today?" },
  { key: "costOfProblem", label: "Cost of the problem", placeholder: "Time or money lost, as they stated it" },
  { key: "quotes", label: "Verbatim quotes", placeholder: "Their exact words, one per line" },
  { key: "body", label: "Notes", placeholder: "Everything else worth keeping" },
  { key: "actionItems", label: "Action items", placeholder: "What we owe them next" },
];

function NoteForm({ onSubmit }: { onSubmit: (input: NoteInput) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<NoteInput["type"]>("INTERVIEW");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("");
  const [texts, setTexts] = useState<Record<string, string>>({});

  if (!open) {
    return (
      <Button variant="secondary" className="h-8 w-full text-[13px] font-semibold" onClick={() => setOpen(true)}>
        <Plus className="size-4" strokeWidth={2.5} />
        Log interview note
      </Button>
    );
  }

  const submit = () => {
    const n = Number(duration);
    onSubmit({
      type,
      durationMin: duration.trim() && !Number.isNaN(n) ? Math.round(n) : null,
      interviewDate: date,
      triggerEvent: texts.triggerEvent?.trim() || null,
      workarounds: texts.workarounds?.trim() || null,
      costOfProblem: texts.costOfProblem?.trim() || null,
      quotes: texts.quotes?.trim() || null,
      body: texts.body?.trim() || null,
      actionItems: texts.actionItems?.trim() || null,
    });
    setOpen(false);
    setTexts({});
    setDuration("");
  };

  return (
    <div className="rounded-lg border border-border p-3.5">
      <div className="mb-3 flex flex-wrap gap-1">
        {NOTE_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            aria-pressed={type === t.key}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
              type === t.key
                ? "border-primary bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground hover:border-ring hover:text-foreground"
            )}
          >
            <t.icon className="size-3.5" strokeWidth={2} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[12px] text-muted-foreground">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-[13px] text-foreground outline-none focus-visible:border-ring"
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-muted-foreground">
          Duration, minutes
          <input
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="45"
            className="h-8 rounded-md border border-input bg-background px-2 text-[13px] text-foreground outline-none focus-visible:border-ring"
          />
        </label>
      </div>

      <div className="space-y-2.5">
        {TEXT_FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-[12px] text-muted-foreground">
            {f.label}
            <textarea
              rows={f.key === "body" || f.key === "quotes" ? 3 : 2}
              value={texts[f.key] ?? ""}
              onChange={(e) => setTexts((prev) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="resize-y rounded-md border border-input bg-background px-2 py-1.5 text-[13px] leading-relaxed text-foreground outline-none focus-visible:border-ring"
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" className="h-7 text-[12.5px]" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button className="h-7 text-[12.5px] font-semibold" onClick={submit}>
          Save note
        </Button>
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onDelete,
}: {
  note: ContactDetail["notes"][number];
  onDelete: () => void;
}) {
  const meta = NOTE_TYPES.find((t) => t.key === note.type) ?? NOTE_TYPES[0];
  const rows: Array<[string, string | null]> = [
    ["Trigger", note.triggerEvent],
    ["Workarounds", note.workarounds],
    ["Cost", note.costOfProblem],
    ["Notes", note.body],
    ["Actions", note.actionItems],
  ];

  return (
    <article className="group rounded-lg border border-border p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-secondary">
          <meta.icon className="size-3.5 text-secondary-foreground" strokeWidth={2} />
        </span>
        <span className="text-[13px] font-semibold text-foreground">{meta.label}</span>
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {new Date(note.interviewDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
        {note.durationMin && (
          <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground">
            <Clock className="size-3" strokeWidth={2} />
            {note.durationMin}m
          </span>
        )}
        <span className="flex-1" />
        {note.author && (
          <span
            className="flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: note.author.color }}
            title={note.author.name}
          >
            {note.author.name[0]}
          </span>
        )}
        <button
          onClick={onDelete}
          aria-label="Delete note"
          className="rounded p-1 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <Trash2 className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      {note.quotes && (
        <blockquote className="mb-2 flex gap-2 rounded-md bg-secondary/60 px-3 py-2">
          <Quote className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2} />
          <p className="text-[12.5px] leading-relaxed whitespace-pre-line text-secondary-foreground">
            {note.quotes}
          </p>
        </blockquote>
      )}

      <dl className="space-y-1">
        {rows
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label} className="flex gap-2 text-[12.5px]">
              <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
              <dd className="min-w-0 leading-relaxed whitespace-pre-line text-foreground">{value}</dd>
            </div>
          ))}
      </dl>
    </article>
  );
}
