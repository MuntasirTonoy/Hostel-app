import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { PublicLinkCard } from "@/components/admin/public-link-card";
import { Button } from "@/components/ui/button";
import { SettingsForms } from "@/features/auth/settings-forms";
import { requireAdminPage } from "@/lib/authz";
import { getAppUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Admin সেটিংস" };

export default async function SettingsPage() {
  const { hostel } = await requireAdminPage();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Admin সেটিংস"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/password">
              <KeyRound /> পাসওয়ার্ড পরিবর্তন
            </Link>
          </Button>
        }
      />
      <PublicLinkCard code={hostel.code} baseUrl={getAppUrl()} />
      <SettingsForms hostelName={hostel.name} />
    </div>
  );
}
