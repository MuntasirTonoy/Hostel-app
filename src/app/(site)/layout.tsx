import { SiteHeader } from "@/components/site-header";
import { getAdminSession } from "@/lib/authz";
import { APP_NAME } from "@/lib/site";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // Signed-in users see a dashboard link instead of login/register.
  const loggedIn = (await getAdminSession()) !== null;
  return (
    <>
      <SiteHeader loggedIn={loggedIn} />
      {children}
      <footer className="no-print border-t text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} {APP_NAME} · All rights reserved by{" "}
            <span className="font-medium text-foreground">Muntasir Tonoy</span>
          </p>
          <p>
            Coding by: <span className="font-medium text-primary">Apex Codes</span>
          </p>
        </div>
      </footer>
    </>
  );
}
