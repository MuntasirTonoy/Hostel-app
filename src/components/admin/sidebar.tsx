"use client";

import {
  FilePlus2,
  UserRound,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/admin/accounts/new", label: "নতুন মাসের হিসাব", icon: FilePlus2 },
  { href: "/admin/accounts", label: "মাসিক হিসাবসমূহ", icon: Files },
  { href: "/admin/members", label: "সদস্য ব্যবস্থাপনা", icon: UsersRound },
  { href: "/admin/profile", label: "প্রোফাইল", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/admin/accounts/new") return pathname === href;
  if (href === "/admin/accounts") return pathname.startsWith(href) && pathname !== "/admin/accounts/new";
  return pathname.startsWith(href);
}

export type SidebarUser = { name: string; hostelName: string };

function NavLinks({ user, onNavigate }: { user: SidebarUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent",
              active && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 border-t pt-4">
        <Link
          href="/admin/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {user.name.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.hostelName}</span>
          </span>
        </Link>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-red-600 hover:text-red-700"
          >
            <LogOut className="size-4" /> লগআউট
          </Button>
        </form>
      </div>
    </nav>
  );
}

/** Desktop sidebar; sits below the global SiteHeader (h-14). */
export function AdminSidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="no-print sticky top-14 hidden h-[calc(100svh-3.5rem)] w-64 shrink-0 flex-col border-r bg-sidebar p-4 lg:flex">
      <NavLinks user={user} />
    </aside>
  );
}

/** Mobile menu button (placed inside the SiteHeader) that opens the sidebar links. */
export function AdminMobileMenu({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="মেনু খুলুন">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-4 p-4">
        <SheetHeader className="p-0">
          <SheetTitle>মেনু</SheetTitle>
        </SheetHeader>
        <NavLinks user={user} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
