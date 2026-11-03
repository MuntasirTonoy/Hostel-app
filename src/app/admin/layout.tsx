import type { Metadata } from "next";
import { AdminMobileMenu, AdminSidebar } from "@/components/admin/sidebar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getI18n } from "@/i18n/server";
import { requireAdminPage } from "@/lib/authz";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { default: t.nav.dashboard, template: "%s | Admin" } };
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdminPage();
  const user = { name: admin.name, hostelName: admin.hostel.name };
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-muted/30">
      <SiteHeader loggedIn menu={<AdminMobileMenu user={user} />} />
      <div className="flex flex-1">
        <AdminSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
