"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitIntake } from "@/actions/board";

export function IntakeForm({ groups }: { groups: { id: string; name: string }[] }) {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState("");
  const [problem, setProblem] = useState("");
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
          <Check className="size-5 text-primary" strokeWidth={2.5} />
        </span>
        <p className="mt-3 text-[15px] font-semibold text-foreground">Thanks, we got it</p>
        <p className="mt-1 max-w-xs text-[12.5px] text-muted-foreground">
          We will reach out to schedule a short conversation.
        </p>
      </div>
    );
  }

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await submitIntake({
        name: name.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        groupId: groupId || null,
        problem: problem.trim() || null,
      });
      setDone(true);
    });
  };

  const field =
    "h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13.5px] text-foreground outline-none focus-visible:border-ring";

  return (
    <div className="space-y-3.5">
      <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Alex Bergstrom" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
          Company or affiliation
          <input value={company} onChange={(e) => setCompany(e.target.value)} className={field} placeholder="Optional" />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="you@example.com" type="email" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
        Which best describes you?
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={field}>
          <option value="">Choose one</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
        What is the hardest part of navigating glaciers for you?
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] leading-relaxed text-foreground outline-none focus-visible:border-ring"
          placeholder="Route planning, crevasse risk, offline maps, anything"
        />
      </label>
      <Button
        onClick={submit}
        disabled={!name.trim() || pending}
        className="h-9 w-full bg-primary text-[13.5px] font-semibold text-white hover:bg-[#0043b0]"
      >
        {pending ? "Sending" : "Send"}
      </Button>
    </div>
  );
}
