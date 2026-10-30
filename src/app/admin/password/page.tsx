import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { requireAdminPage } from "@/lib/authz";

export const metadata: Metadata = { title: "পাসওয়ার্ড পরিবর্তন" };

export default async function PasswordPage() {
  const admin = await requireAdminPage();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="পাসওয়ার্ড পরিবর্তন" description="বর্তমান পাসওয়ার্ড দিয়ে নতুন পাসওয়ার্ড সেট করুন।" />
      <ChangePasswordForm email={admin.email} />
    </div>
  );
}
