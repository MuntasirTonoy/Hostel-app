import type { Metadata } from "next";
import { HostelCodeForm } from "@/components/report/hostel-code-form";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.monthlyBill };
}

export default async function MonthlyReportIndexPage() {
  const { t } = await getI18n();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t.billLookup.title}</h1>
        <p className="text-muted-foreground">{t.billLookup.intro}</p>
        <HostelCodeForm />
      </div>
    </main>
  );
}
