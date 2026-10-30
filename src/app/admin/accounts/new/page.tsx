import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { NewMonthForm } from "@/features/accounting/new-month-form";
import { requireAdminPage } from "@/lib/authz";
import { currentPeriod } from "@/lib/months";
import { listMembers } from "@/services/member-service";

export const metadata: Metadata = { title: "নতুন মাসের হিসাব" };

export default async function NewAccountPage({ searchParams }: PageProps<"/admin/accounts/new">) {
  const { hostel } = await requireAdminPage();
  const params = await searchParams;
  const now = currentPeriod();
  const month = Number(params.month);
  const year = Number(params.year);
  const registry = await listMembers(hostel.id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="নতুন মাসের হিসাব"
        description="পূর্ববর্তী মাসের সদস্যরা স্বয়ংক্রিয়ভাবে যুক্ত হবে; প্রয়োজনে সদস্য যোগ বা বাদ দিন।"
      />
      <NewMonthForm
        registry={registry}
        defaultMonth={month >= 1 && month <= 12 ? month : now.month}
        defaultYear={year >= 2000 && year <= 2100 ? year : now.year}
      />
    </div>
  );
}
