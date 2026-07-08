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

/* Active item = ink block with the red blaze on its left edge.
   Inactive = quiet, surfaces on hover. */
function itemClass(active: boolean) {
  return cn(
    "group relative flex h-9 items-center gap-2.5 px-3 text-[13px] font-medium transition-colors duration-150",
    active
      ? "bg-foreground text-background"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
  );
}

function Blaze({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "absolute inset-y-0 left-0 w-[3px] bg-signal transition-transform duration-150",
        active ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
      )}
      aria-hidden="true"
    />
  );
}

export function SidebarNav({ taskCount }: { taskCount: number }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {group.label && (
            <p className="type-legend px-3 pb-1.5 text-muted-foreground">{group.label}</p>
          )}
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={itemClass(active)}>
                <Blaze active={active} />
                <item.icon className="size-4" strokeWidth={1.9} />
                {item.label}
                {item.href === "/tasks" && taskCount > 0 && (
                  <span
                    className={cn(
                      "ml-auto px-1.5 font-mono text-[11px] font-semibold tabular-nums",
                      active
                        ? "bg-background/20 text-background"
                        : "border text-muted-foreground"
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
          <Blaze active={pathname.startsWith("/admin")} />
          <ShieldCheck className="size-4" strokeWidth={1.9} />
          Admin
        </Link>
      )}
      <Link href="/settings" className={itemClass(pathname.startsWith("/settings"))}>
        <Blaze active={pathname.startsWith("/settings")} />
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
          className="flex h-9 items-center gap-1.5 border bg-background px-1.5 transition-colors duration-150 hover:border-foreground/50"
        >
          <span
            className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {initials}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[12px] font-normal text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{name}</span>
          <span className="type-legend ml-1.5 bg-secondary px-1.5 py-0.5 text-secondary-foreground">
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
