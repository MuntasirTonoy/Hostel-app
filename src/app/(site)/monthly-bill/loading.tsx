import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 py-10" aria-busy="true">
      <p className="sr-only">হিসাব লোড হচ্ছে…</p>
      <Skeleton className="mx-auto h-8 w-72" />
      <Skeleton className="mx-auto h-5 w-48" />
      <Skeleton className="h-80 w-full" />
    </main>
  );
}
