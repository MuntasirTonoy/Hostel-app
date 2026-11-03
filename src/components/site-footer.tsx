import { APP_NAME } from "@/lib/site";

/** Site footer, shown on public pages and in the admin area (stacks into centred lines on mobile). */
export function SiteFooter() {
  return (
    <footer className="no-print border-t text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
        <p className="flex flex-col items-center gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-1">
          <span className="whitespace-nowrap">
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <span className="whitespace-nowrap">
            All rights reserved by <span className="font-medium text-foreground">Muntasir Tonoy</span>
          </span>
        </p>
        <p className="whitespace-nowrap border-t pt-3 text-xs sm:border-0 sm:pt-0 sm:text-sm">
          Coding by: <span className="font-medium text-primary">Apex Codes</span>
        </p>
      </div>
    </footer>
  );
}
