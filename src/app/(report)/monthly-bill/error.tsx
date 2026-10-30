"use client";

import { Button } from "@/components/ui/button";

export default function ReportError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">হিসাব লোড করা যায়নি</h1>
      <p className="text-muted-foreground">
        সার্ভার বা ডাটাবেসে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।
      </p>
      <Button onClick={reset}>আবার চেষ্টা করুন</Button>
    </main>
  );
}
