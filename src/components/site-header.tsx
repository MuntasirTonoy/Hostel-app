"use client";

import { Calculator, FileText, Home, LayoutDashboard, LogIn, UserPlus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { APP_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

const COMMON_LINKS = [
  { href: "/", key: "home", icon: Home },
  { href: "/monthly-bill", key: "monthlyBill", icon: FileText },
] as const;
const GUEST_LINKS = [
  { href: "/login", key: "login", icon: LogIn },
  { href: "/register", key: "register", icon: UserPlus },
] as const;
const USER_LINKS = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/profile", key: "profile", icon: UserRound },
] as const;

/**
 * Global navigation bar, shown on public pages and in the admin area.
 * Signed-in users see a dashboard link instead of login/register.
 * `menu` is an optional element (the admin sidebar's mobile menu button).
 */
export function SiteHeader({ loggedIn, menu }: { loggedIn: boolean; menu?: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = [...COMMON_LINKS, ...(loggedIn ? USER_LINKS : GUEST_LINKS)];
  // Highlight only the most specific matching link (e.g. /admin/profile, not also /admin).
  const activeHref = links
    .map((l) => l.href as string)
    .filter((href) => (href === "/" ? pathname === "/" : pathname.startsWith(href)))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;

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
          {links.map(({ href, key, icon: Icon }) => {
            const label = t.nav[key];
            return (
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
            );
          })}
        </nav>
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
