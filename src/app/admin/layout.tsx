import type { Metadata } from "next";
import { AdminMobileMenu, AdminSidebar } from "@/components/admin/sidebar";
import { SiteHeader } from "@/components/site-header";
import { requireAdminPage } from "@/lib/authz";

export const metadata: Metadata = { title: { default: "ড্যাশবোর্ড", template: "%s | Admin" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdminPage();
  const label = `${admin.hostel.name} · ${admin.name}`;
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-muted/30">
      <SiteHeader loggedIn menu={<AdminMobileMenu adminName={label} />} />
      <div className="flex flex-1">
        <AdminSidebar adminName={label} />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
