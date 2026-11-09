import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { PublicLinkCard } from "@/components/admin/public-link-card";
import { ContactsManager } from "@/features/members/contacts-manager";
import { getI18n } from "@/i18n/server";
import { requireAdminPage } from "@/lib/authz";
import { getAppUrl } from "@/lib/site";
import { listContacts } from "@/services/contact-service";
import { listMembers } from "@/services/member-service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.contacts };
}

export default async function ContactsPage() {
  const { hostel } = await requireAdminPage();
  const [members, contacts, { t }] = await Promise.all([
    listMembers(hostel.id, { activeOnly: true }),
    listContacts(hostel.id),
    getI18n(),
  ]);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t.nav.contacts} description={t.contacts.description} />
      <PublicLinkCard code={hostel.code} baseUrl={getAppUrl()} kind="contacts" />
      <ContactsManager initialMembers={members} initialContacts={contacts} />
    </div>
  );
}
