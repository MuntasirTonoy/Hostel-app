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
      <footer className="no-print border-t py-6 text-center text-sm text-muted-foreground">
        {APP_NAME} — হোস্টেলের স্বচ্ছ ও স্বয়ংক্রিয় মাসিক হিসাব
      </footer>
    </>
  );
}
