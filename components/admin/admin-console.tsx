"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, Check, Link2, Copy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createStatus,
  renameStatus,
  recolorStatus,
  deleteStatus,
  createGroup,
  renameGroup,
  setGroupColor,
  deleteGroup,
  createTeamMember,
} from "@/actions/board";
import { setUserRole, removeTeamMember, updateSsoConfig } from "@/actions/admin";
import { STATUS_COLORS } from "@/lib/status-colors";
import { initials, type BoardDTO, type StatusDTO, type StatusColumnKey } from "@/lib/board-types";
import { cn } from "@/lib/utils";

const PALETTE = Object.values(STATUS_COLORS);

type TeamMember = {
  id: string;
  name: string;
  email: string;
  color: string;
  role: "ADMIN" | "MEMBER";
  contactCount: number;
};

export type SsoState = {
  passwordLoginEnabled: boolean;
  microsoftEnabled: boolean;
  microsoftTenantId: string;
  microsoftClientId: string;
  ssoAllowedDomain: string;
  ssoAutoProvision: boolean;
  env: {
    secret: boolean;
    tenantId: boolean;
    clientId: boolean;
    enabled: boolean;
    allowedDomain: boolean;
  };
};

export function AdminConsole({
  board,
  users,
  currentUserId,
  sso,
}: {
  board: BoardDTO;
  users: TeamMember[];
  currentUserId: string;
  sso: SsoState;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-5 text-primary" strokeWidth={2} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin console</h1>
        </div>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Everything the workspace needs: people, columns, sharing, and sign-in.
        </p>

        <AuthSettings sso={sso} />
        <TeamRoles users={users} currentUserId={currentUserId} />
        <StatusManager title="Stages" hint="The validation pipeline" column="STAGE" items={board.stages} />
        <StatusManager
          title="Problem confirmation"
          hint="Did the audience confirm the problem?"
          column="PROBLEM"
          items={board.problems}
        />
        <StatusManager
          title="Follow-up options"
          hint="What to do next with a contact"
          column="FOLLOWUP"
          items={board.followups}
        />
        <StatusManager title="Priority" hint="How urgent a contact is" column="PRIORITY" items={board.priorities} />
        <GroupManager groups={board.groups} />
        <Sharing />
      </div>
    </div>
  );
}

/* ---------- authentication / M365 SSO ---------- */

function AuthSettings({ sso }: { sso: SsoState }) {
  const [pwLogin, setPwLogin] = useState(sso.passwordLoginEnabled);
  const [msEnabled, setMsEnabled] = useState(sso.microsoftEnabled);
  const [tenant, setTenant] = useState(sso.microsoftTenantId);
  const [clientId, setClientId] = useState(sso.microsoftClientId);
  const [domain, setDomain] = useState(sso.ssoAllowedDomain);
  const [autoProvision, setAutoProvision] = useState(sso.ssoAutoProvision);
  const [origin, setOrigin] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => setOrigin(window.location.origin), []);

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateSsoConfig({
          passwordLoginEnabled: pwLogin,
          microsoftEnabled: msEnabled,
          microsoftTenantId: tenant || null,
          microsoftClientId: clientId || null,
          ssoAllowedDomain: domain || null,
          ssoAutoProvision: autoProvision,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save.");
      }
    });
  };

  const field =
    "h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] text-foreground outline-none focus-visible:border-ring disabled:opacity-60";
  const envHint = (on: boolean) =>
    on ? (
      <span className="ml-1.5 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
        from .env
      </span>
    ) : null;

  return (
    <Section title="Authentication" hint="How people sign in to this workspace">
      <div className="space-y-3">
        <ToggleRow
          label="Password sign-in"
          desc="Email and password login"
          on={pwLogin}
          onChange={setPwLogin}
        />
        <ToggleRow
          label="Microsoft 365 SSO"
          desc="Let people sign in with their Microsoft work account"
          on={msEnabled}
          onChange={setMsEnabled}
        />

        {msEnabled && (
          <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3.5">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
                Directory (tenant) ID {envHint(sso.env.tenantId)}
                <input value={tenant} onChange={(e) => setTenant(e.target.value)} disabled={sso.env.tenantId} className={field} placeholder="organizations" />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
                Application (client) ID {envHint(sso.env.clientId)}
                <input value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={sso.env.clientId} className={field} placeholder="00000000-0000-…" />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
              Allowed email domain {envHint(sso.env.allowedDomain)}
              <input value={domain} onChange={(e) => setDomain(e.target.value)} disabled={sso.env.allowedDomain} className={field} placeholder="glacianav.com (optional)" />
            </label>
            <ToggleRow
              label="Auto-provision new users"
              desc="Create a Member account the first time someone signs in with Microsoft"
              on={autoProvision}
              onChange={setAutoProvision}
            />
            <div
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-[12px]",
                sso.env.secret
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              )}
            >
              <span className="font-semibold">Client secret:</span>
              {sso.env.secret
                ? "provided by the MS_CLIENT_SECRET environment variable."
                : "not set. Add MS_CLIENT_SECRET to your .env to finish enabling SSO."}
            </div>
            <div className="rounded-md border border-border bg-card px-3 py-2">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Redirect URI to register in Entra ID
              </p>
              <p className="mt-0.5 font-mono text-[12px] break-all text-foreground">
                {origin}/api/auth/microsoft/callback
              </p>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                Register an app with this redirect URI and the delegated scopes openid, profile,
                email, User.Read. Secrets live in .env only, never in the database.
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-[12.5px] text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={pending}
            className="h-8 bg-primary text-[12.5px] font-semibold text-white hover:bg-[#0043b0]"
          >
            {pending ? "Saving" : saved ? "Saved" : "Save authentication"}
          </Button>
        </div>
      </div>
    </Section>
  );
}

function ToggleRow({
  label,
  desc,
  on,
  onChange,
}: {
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-[11.5px] text-muted-foreground">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
            on ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

/* ---------- team & roles ---------- */

function TeamRoles({ users, currentUserId }: { users: TeamMember[]; currentUserId: string }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed.");
      }
    });

  const submit = () => {
    if (!name.trim() || !email.trim()) return;
    run(async () => {
      await createTeamMember(name.trim(), email.trim(), color);
      setName("");
      setEmail("");
      setAdding(false);
    });
  };

  return (
    <Section title="Team and roles" hint="Who can use the workspace, and what they can do">
      {error && <p className="mb-2 text-[12.5px] text-destructive">{error}</p>}
      <div className="space-y-1.5">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: u.color }}
            >
              {initials(u.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {u.name}
                {u.id === currentUserId && (
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">you</span>
                )}
              </p>
              <p className="truncate text-[11.5px] text-muted-foreground">{u.email}</p>
            </div>
            <span className="font-mono text-[11.5px] text-muted-foreground">
              {u.contactCount} leading
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-md border border-border px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-muted">
                  {u.role === "ADMIN" ? "Admin" : "Member"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={() => run(() => setUserRole(u.id, "ADMIN"))}
                  className="text-[13px]"
                >
                  Admin
                  {u.role === "ADMIN" && <Check className="ml-auto size-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => run(() => setUserRole(u.id, "MEMBER"))}
                  className="text-[13px]"
                >
                  Member
                  {u.role === "MEMBER" && <Check className="ml-auto size-3.5 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => run(() => removeTeamMember(u.id))}
              disabled={u.id === currentUserId}
              aria-label={`Remove ${u.name}`}
              className="rounded p-1 text-muted-foreground transition-colors enabled:hover:bg-muted enabled:hover:text-destructive disabled:opacity-30"
              title={u.id === currentUserId ? "You can't remove yourself" : "Remove"}
            >
              <Trash2 className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="mt-2 rounded-md border border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-8 rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:border-ring" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" className="h-8 rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:border-ring" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {PALETTE.slice(0, 6).map((hex) => (
              <button key={hex} onClick={() => setColor(hex)} aria-label={`Color ${hex}`} className={cn("size-6 rounded-md", color === hex && "ring-2 ring-ring ring-offset-1")} style={{ backgroundColor: hex }} />
            ))}
            <span className="flex-1" />
            <Button variant="ghost" className="h-7 text-[12.5px]" onClick={() => setAdding(false)}>Cancel</Button>
            <Button className="h-7 text-[12.5px] font-semibold" disabled={!name.trim() || !email.trim() || pending} onClick={submit}>Add member</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <Plus className="size-3.5" strokeWidth={2.2} /> Add team member
        </button>
      )}
      <p className="mt-2 text-[11.5px] text-muted-foreground">
        New members can sign in with the password glacianav, or via Microsoft 365 if enabled above.
      </p>
    </Section>
  );
}

/* ---------- statuses ---------- */

function StatusManager({
  title,
  hint,
  column,
  items,
}: {
  title: string;
  hint: string;
  column: StatusColumnKey;
  items: StatusDTO[];
}) {
  const [, startTransition] = useTransition();
  return (
    <Section title={title} hint={hint}>
      <div className="space-y-1.5">
        {items.map((s) => (
          <EditableRow
            key={s.id}
            label={s.label}
            color={s.color}
            onRename={(v) => startTransition(() => renameStatus(s.id, v))}
            onRecolor={(c) => startTransition(() => recolorStatus(s.id, c))}
            onDelete={() => startTransition(() => deleteStatus(s.id))}
          />
        ))}
      </div>
      <AddRow
        placeholder={`New ${title.toLowerCase()} option`}
        onAdd={(label, color) => startTransition(() => createStatus(column, label, color))}
      />
    </Section>
  );
}

/* ---------- groups ---------- */

function GroupManager({ groups }: { groups: BoardDTO["groups"] }) {
  const [, startTransition] = useTransition();
  return (
    <Section title="Segments" hint="Groups of contacts on the board">
      <div className="space-y-1.5">
        {groups.map((g) => (
          <EditableRow
            key={g.id}
            label={g.name}
            color={g.color}
            meta={`${g.contacts.length} contacts`}
            deletable={g.contacts.length === 0}
            onRename={(v) => startTransition(() => renameGroup(g.id, v))}
            onRecolor={(c) => startTransition(() => setGroupColor(g.id, c))}
            onDelete={() => startTransition(() => deleteGroup(g.id))}
          />
        ))}
      </div>
      <AddRow
        placeholder="New segment name"
        onAdd={(label, color) => startTransition(() => createGroup(label, color))}
      />
    </Section>
  );
}

/* ---------- sharing ---------- */

function Sharing() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <Section title="Sharing" hint="Public links you can hand out">
      <ShareRow label="Intake form" path="/intake" origin={origin} openable />
      <ShareRow label="Calendar feed (.ics)" path="/api/calendar.ics" origin={origin} />
    </Section>
  );
}

function ShareRow({ label, path, origin, openable }: { label: string; path: string; origin: string; openable?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = origin ? `${origin}${path}` : path;
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
      <Link2 className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-foreground">{label}</p>
        <p className="truncate font-mono text-[11.5px] text-muted-foreground">{url}</p>
      </div>
      {openable && (
        <a href={path} target="_blank" rel="noreferrer" className="rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          Open
        </a>
      )}
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-primary" strokeWidth={2.5} /> : <Copy className="size-3.5" strokeWidth={2} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* ---------- shared primitives ---------- */

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-5">
      <div className="mb-3">
        <h2 className="text-[14px] font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function EditableRow({
  label,
  color,
  meta,
  deletable = true,
  onRename,
  onRecolor,
  onDelete,
}: {
  label: string;
  color: string;
  meta?: string;
  deletable?: boolean;
  onRename: (v: string) => void;
  onRecolor: (c: string) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(label);
  useEffect(() => setDraft(label), [label]);
  return (
    <div className="group flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <button aria-label="Change color" className="size-6 shrink-0 rounded-md transition-transform hover:scale-105" style={{ backgroundColor: color }} />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40 p-2">
          <div className="grid grid-cols-5 gap-1.5">
            {PALETTE.map((hex) => (
              <button key={hex} onClick={() => onRecolor(hex)} aria-label={`Color ${hex}`} className={cn("size-6 rounded-md transition-transform hover:scale-110", color === hex && "ring-2 ring-ring ring-offset-1")} style={{ backgroundColor: hex }} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft.trim() && draft !== label && onRename(draft.trim())}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1 text-[13px] text-foreground outline-none hover:bg-muted focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring"
      />
      {meta && <span className="shrink-0 text-[11.5px] text-muted-foreground">{meta}</span>}
      <button
        onClick={onDelete}
        disabled={!deletable}
        aria-label={`Delete ${label}`}
        className="shrink-0 rounded p-1 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground enabled:hover:bg-muted enabled:hover:text-destructive disabled:cursor-not-allowed disabled:group-hover:text-muted-foreground/30"
        title={deletable ? "Delete" : "Move contacts out first"}
      >
        <Trash2 className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (label: string, color: string) => void }) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const submit = () => {
    if (!label.trim()) return;
    onAdd(label.trim(), color);
    setLabel("");
  };
  return (
    <div className="mt-2 flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button aria-label="Pick color" className="size-6 shrink-0 rounded-md" style={{ backgroundColor: color }} />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40 p-2">
          <div className="grid grid-cols-5 gap-1.5">
            {PALETTE.map((hex) => (
              <button key={hex} onClick={() => setColor(hex)} aria-label={`Color ${hex}`} className={cn("size-6 rounded-md transition-transform hover:scale-110", color === hex && "ring-2 ring-ring ring-offset-1")} style={{ backgroundColor: hex }} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <input value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={placeholder} className="h-8 flex-1 rounded-md border border-dashed border-input bg-background px-2 text-[13px] outline-none focus-visible:border-ring" />
      <Button variant="secondary" className="h-8 text-[12.5px] font-semibold" onClick={submit} disabled={!label.trim()}>Add</Button>
    </div>
  );
}
