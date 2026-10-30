"use client";

import { Calculator, FileText, Home, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const COMMON_LINKS = [
  { href: "/", label: "হোম", icon: Home },
  { href: "/monthly-bill", label: "মাসিক হিসাব", icon: FileText },
];
const GUEST_LINKS = [
  { href: "/login", label: "লগইন", icon: LogIn },
  { href: "/register", label: "রেজিস্টার", icon: UserPlus },
];
const USER_LINKS = [{ href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard }];

/**
 * Global navigation bar, shown on public pages and in the admin area.
 * Signed-in users see a dashboard link instead of login/register.
 * `menu` is an optional element (the admin sidebar's mobile menu button).
 */
export function SiteHeader({ loggedIn, menu }: { loggedIn: boolean; menu?: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const links = [...COMMON_LINKS, ...(loggedIn ? USER_LINKS : GUEST_LINKS)];

  return (
    <header className="no-print sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="flex h-14 w-full items-center gap-2 px-4 sm:px-6">
        {menu}
        <Link href="/" className="mr-auto flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calculator className="size-4" />
          </span>
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(href) && "bg-muted text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
