"use client";

import { Button } from "@/components/ui/button";

const BANGLA = /[ঀ-৿]/;

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-xl font-semibold">কিছু একটা সমস্যা হয়েছে</h1>
      <p className="text-muted-foreground">
        {BANGLA.test(error.message ?? "")
          ? error.message
          : "তথ্য লোড করা যায়নি। ডাটাবেস সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"}
      </p>
      <Button onClick={reset}>আবার চেষ্টা করুন</Button>
    </div>
  );
}
