import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";

export default async function Loading() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 py-10" aria-busy="true">
      <p className="sr-only">{t.publicReport.loading}</p>
      <Skeleton className="mx-auto h-8 w-72" />
      <Skeleton className="mx-auto h-5 w-48" />
      <Skeleton className="h-80 w-full" />
    </main>
  );
}
