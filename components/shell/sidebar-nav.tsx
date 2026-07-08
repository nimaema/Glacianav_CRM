"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  LayoutDashboard,
  Table2,
  CalendarDays,
  ChartNoAxesColumn,
  Users,
  ListChecks,
  Settings,
  ShieldCheck,
  ChevronDown,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";

const GROUPS = [
  { label: null, items: [{ href: "/", label: "Home", icon: LayoutDashboard }] },
  {
    label: "Workspace",
    items: [
      { href: "/board", label: "Board", icon: Table2 },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/insights", label: "Insights", icon: ChartNoAxesColumn },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/tasks", label: "Tasks", icon: ListChecks },
    ],
  },
];

function itemClass(active: boolean) {
  return cn(
    "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all",
    active
      ? "bg-[#07111f] text-white shadow-[0_12px_24px_rgba(9,20,38,0.18)]"
      : "text-muted-foreground hover:bg-white/80 hover:text-foreground hover:shadow-sm"
  );
}

export function SidebarNav({ taskCount }: { taskCount: number }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map((group, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {group.label && (
            <p className="px-2.5 pb-1 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground/70 uppercase">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={itemClass(active)}>
                <item.icon className={cn("size-4", active && "text-[#8fc3ff]")} strokeWidth={1.9} />
                {item.label}
                {item.href === "/tasks" && taskCount > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 font-mono text-[10.5px] font-semibold",
                      active ? "bg-white/18 text-white" : "bg-white/75 text-secondary-foreground shadow-sm"
                    )}
                  >
                    {taskCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function BottomLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-0.5">
      {isAdmin && (
        <Link href="/admin" className={itemClass(pathname.startsWith("/admin"))}>
          <ShieldCheck className="size-4" strokeWidth={1.9} />
          Admin
        </Link>
      )}
      <Link href="/settings" className={itemClass(pathname.startsWith("/settings"))}>
        <Settings className="size-4" strokeWidth={1.9} />
        Settings
      </Link>
    </div>
  );
}

export function AccountMenu({
  name,
  role,
  color,
  initials,
}: {
  name: string;
  role: "ADMIN" | "MEMBER";
  color: string;
  initials: string;
}) {
  const [pending, startTransition] = useTransition();
  const roleLabel = role === "ADMIN" ? "Admin" : "Member";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Account: ${name}`}
        className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 p-1 shadow-sm transition-colors hover:bg-white"
        >
          <span
            className="flex size-7 items-center justify-center rounded-full text-[10.5px] font-semibold text-white shadow-sm ring-2 ring-white"
            style={{ backgroundColor: color }}
          >
            {initials}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[12px] font-normal text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{name}</span>
          <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground uppercase">
            {roleLabel}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 text-[13px]">
          <Link href="/settings">Account settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => logout());
          }}
          className="gap-2 text-[13px]"
          variant="destructive"
        >
          <LogOut className="size-3.5" />
          {pending ? "Signing out" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
