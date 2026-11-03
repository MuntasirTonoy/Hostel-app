import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAdminSession } from "@/lib/authz";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // Signed-in users see a dashboard link instead of login/register.
  const loggedIn = (await getAdminSession()) !== null;
  return (
    <>
      <SiteHeader loggedIn={loggedIn} />
      {children}
      <SiteFooter />
    </>
  );
}
