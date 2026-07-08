"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createContactDetailed } from "@/actions/board";
import type { ChannelKey } from "@/lib/board-types";

type Group = { id: string; name: string; color: string };

const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: "EMAIL", label: "Email" },
  { key: "LINKEDIN", label: "LinkedIn" },
  { key: "PHONE", label: "Phone / text" },
];

export function NewContactDialog({
  groups,
  trigger,
}: {
  groups: Group[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [channel, setChannel] = useState<ChannelKey | "">("");
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setName("");
    setCompany("");
    setEmail("");
    setChannel("");
    setGroupId(groups[0]?.id ?? "");
  };

  const submit = (goToBoard: boolean) => {
    if (!name.trim() || !groupId) return;
    startTransition(async () => {
      await createContactDetailed({
        groupId,
        name: name.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        channel: channel || null,
      });
      reset();
      if (goToBoard) {
        setOpen(false);
        router.push("/board");
      }
      // "Add another" keeps the dialog open for rapid entry
    });
  };

  const field =
    "h-10 w-full border border-input bg-background px-2.5 text-[13.5px] text-foreground outline-none transition-colors duration-150 hover:border-foreground/50";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="type-poster text-[20px]">New contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5 pt-1">
          <label className="flex flex-col gap-1 type-legend text-foreground">
            Name
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit(false)}
              className={field}
              placeholder="Alex Bergstrom"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 type-legend text-foreground">
              Company
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={field}
                placeholder="Optional"
              />
            </label>
            <label className="flex flex-col gap-1 type-legend text-foreground">
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
                placeholder="Optional"
                type="email"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 type-legend text-foreground">
              Segment
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={field}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 type-legend text-foreground">
              Preferred channel
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ChannelKey | "")}
                className={field}
              >
                <option value="">Not set</option>
                {CHANNELS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              className="h-9 text-[13px]"
              disabled={!name.trim() || pending}
              onClick={() => submit(false)}
            >
              Add another
            </Button>
            <Button
              className="h-9 text-[13px] font-semibold"
              disabled={!name.trim() || pending}
              onClick={() => submit(true)}
            >
              {pending ? "Creating…" : "Create + open board"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
