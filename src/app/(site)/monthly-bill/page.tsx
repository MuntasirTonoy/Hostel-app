import type { Metadata } from "next";
import { HostelCodeForm } from "@/components/report/hostel-code-form";

export const metadata: Metadata = { title: "মাসিক হিসাব" };

export default function MonthlyReportIndexPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">মাসিক হিসাব দেখুন</h1>
        <p className="text-muted-foreground">
          আপনার হোস্টেলের কোড লিখুন। কোডটি হোস্টেলের Admin এর কাছ থেকে পাবেন (যেমন: k7x2p9)।
        </p>
        <HostelCodeForm />
      </div>
    </main>
  );
}
