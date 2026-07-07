"use client";

import { useState, useTransition } from "react";
import { UserRound, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile, updateNotifyPrefs } from "@/actions/account";
import type { NotifyPrefs } from "@/lib/notify";
import { STATUS_COLORS } from "@/lib/status-colors";
import { initials } from "@/lib/board-types";
import { cn } from "@/lib/utils";

const PALETTE = Object.values(STATUS_COLORS);

export function UserSettings({
  name: initialName,
  email,
  color: initialColor,
  role,
  prefs: initialPrefs,
}: {
  name: string;
  email: string;
  color: string;
  role: "ADMIN" | "MEMBER";
  prefs: NotifyPrefs;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account settings</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Your profile and notification preferences.
        </p>
        <ProfileCard name={initialName} email={email} color={initialColor} role={role} />
        <NotifyCard prefs={initialPrefs} />
      </div>
    </div>
  );
}

function ProfileCard({
  name: initialName,
  email,
  color: initialColor,
  role,
}: {
  name: string;
  email: string;
  color: string;
  role: "ADMIN" | "MEMBER";
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = name.trim() !== initialName || color !== initialColor;
  const save = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateProfile(name.trim(), color);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <Section title="Profile" icon={<UserRound className="size-4 text-primary" strokeWidth={2} />}>
      <div className="flex items-center gap-3 pb-4">
        <span
          className="flex size-12 items-center justify-center rounded-full text-[16px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {initials(name || "?")}
        </span>
        <div>
          <p className="text-[13px] text-muted-foreground">{email}</p>
          <span className="mt-0.5 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground uppercase">
            {role === "ADMIN" ? "Admin" : "Member"}
          </span>
        </div>
      </div>
      <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
        Display name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13.5px] text-foreground outline-none focus-visible:border-ring"
        />
      </label>
      <div className="mt-3">
        <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">Avatar color</p>
        <div className="flex flex-wrap gap-1.5">
          {PALETTE.map((hex) => (
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
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          onClick={save}
          disabled={!dirty || !name.trim() || pending}
          className="h-8 bg-primary text-[12.5px] font-semibold text-white hover:bg-[#0043b0]"
        >
          {pending ? "Saving" : saved ? "Saved" : "Save profile"}
        </Button>
      </div>
    </Section>
  );
}

function NotifyCard({ prefs: initial }: { prefs: NotifyPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof NotifyPrefs>(k: K, v: NotifyPrefs[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  const save = () =>
    startTransition(async () => {
      await updateNotifyPrefs(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });

  const toggles: { key: keyof NotifyPrefs; label: string; desc: string }[] = [
    { key: "interviews", label: "Interviews today", desc: "Remind me about interviews scheduled for today" },
    { key: "followups", label: "Open follow-ups", desc: "Notify me about follow-ups that are still open" },
    { key: "stale", label: "Going cold", desc: "Warn me when a contact sits untouched too long" },
  ];

  return (
    <Section title="Notifications" icon={<Bell className="size-4 text-primary" strokeWidth={2} />}>
      <div className="space-y-3">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">{t.label}</p>
              <p className="text-[11.5px] text-muted-foreground">{t.desc}</p>
            </div>
            <button
              role="switch"
              aria-checked={Boolean(prefs[t.key])}
              aria-label={t.label}
              onClick={() => set(t.key, !prefs[t.key] as never)}
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                prefs[t.key] ? "bg-primary" : "bg-input"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
                  prefs[t.key] ? "translate-x-[18px]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div>
            <p className="text-[13px] font-medium text-foreground">Mark a contact cold after</p>
            <p className="text-[11.5px] text-muted-foreground">Days of no activity before a warning</p>
          </div>
          <div className="flex items-center gap-1">
            {[3, 7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => set("staleDays", d)}
                className={cn(
                  "rounded-md px-2 py-1 font-mono text-[12px] font-semibold transition-colors",
                  prefs.staleDays === d ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          onClick={save}
          disabled={pending}
          className="h-8 bg-primary text-[12.5px] font-semibold text-white hover:bg-[#0043b0]"
        >
          {pending ? "Saving" : saved ? "Saved" : "Save preferences"}
        </Button>
      </div>
    </Section>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-[14px] font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}
