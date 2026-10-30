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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
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
      <form action={logoutAction} className="mt-auto pt-4">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-red-600 hover:text-red-700"
        >
          <LogOut className="size-4" /> লগআউট
        </Button>
      </form>
    </nav>
  );
}

/** Desktop sidebar; sits below the global SiteHeader (h-14). */
export function AdminSidebar({ adminName }: { adminName: string }) {
  return (
    <aside className="no-print sticky top-14 hidden h-[calc(100svh-3.5rem)] w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 lg:flex">
      <Link
        href="/admin/profile"
        className="truncate px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {adminName}
      </Link>
      <NavLinks />
    </aside>
  );
}

/** Mobile menu button (placed inside the SiteHeader) that opens the sidebar links. */
export function AdminMobileMenu({ adminName }: { adminName: string }) {
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
        <Link
          href="/admin/profile"
          onClick={() => setOpen(false)}
          className="truncate px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {adminName}
        </Link>
        <NavLinks onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
