import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { MembersManager } from "@/features/members/members-manager";
import { getI18n } from "@/i18n/server";
import { requireAdminPage } from "@/lib/authz";
import { listMembers } from "@/services/member-service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.members };
}

export default async function MembersPage() {
  const { hostel } = await requireAdminPage();
  const [members, { t }] = await Promise.all([listMembers(hostel.id), getI18n()]);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t.nav.members} description={t.members.description} />
      <MembersManager initialMembers={members} />
    </div>
  );
}
