import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { MembersManager } from "@/features/members/members-manager";
import { requireAdminPage } from "@/lib/authz";
import { listMembers } from "@/services/member-service";

export const metadata: Metadata = { title: "সদস্য ব্যবস্থাপনা" };

export default async function MembersPage() {
  const { hostel } = await requireAdminPage();
  const members = await listMembers(hostel.id);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="সদস্য ব্যবস্থাপনা" description="হোস্টেলের স্থায়ী সদস্য তালিকা" />
      <MembersManager initialMembers={members} />
    </div>
  );
}
