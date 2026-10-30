import {
  ArrowRight,
  Calculator,
  FileText,
  Printer,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminSession } from "@/lib/authz";

const FEATURES = [
  {
    icon: Calculator,
    title: "স্বয়ংক্রিয় হিসাব",
    text: "মিল রেট, জনপ্রতি অতিরিক্ত খরচ, বকেয়া ও ফেরত — সব নিজে থেকেই হিসাব হয়।",
  },
  {
    icon: UsersRound,
    title: "সদস্য স্বয়ংক্রিয়ভাবে যুক্ত",
    text: "নতুন মাসে আগের মাসের সদস্য তালিকা নিজে থেকেই চলে আসে।",
  },
  {
    icon: Wallet,
    title: "পয়সা পর্যন্ত নির্ভুল",
    text: "প্রতিটি হিসাব পয়সা পর্যন্ত মিলিয়ে দেখা হয় — মোট খরচ সবসময় মিলে যায়।",
  },
  {
    icon: FileText,
    title: "সবার জন্য উন্মুক্ত রিপোর্ট",
    text: "প্রতিটি হোস্টেলের নিজস্ব লিংক — প্রকাশিত হিসাব লগইন ছাড়াই যে কেউ মোবাইলে দেখতে পারে।",
  },
  {
    icon: Printer,
    title: "প্রিন্ট ও PDF",
    text: "এক ক্লিকে হিসাব প্রিন্ট করুন বা PDF ডাউনলোড করে গ্রুপে শেয়ার করুন।",
  },
  {
    icon: ShieldCheck,
    title: "নিরাপদ ব্যবস্থাপনা",
    text: "প্রতিটি হোস্টেলের তথ্য আলাদা — শুধু সেই হোস্টেলের Admin হিসাব তৈরি, সম্পাদনা ও প্রকাশ করতে পারেন।",
  },
];

export default async function LandingPage() {
  const loggedIn = (await getAdminSession()) !== null;
  return (
    <main className="flex-1">
      <section className="border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <span className="rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
            হোস্টেলের মাসিক মিল ব্যবস্থাপনা
          </span>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            মিলের হিসাব এখন <span className="text-primary">সহজ, স্বচ্ছ ও নির্ভুল</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            জমা, মিল সংখ্যা, বাজার ও অতিরিক্ত খরচ লিখুন — বাকি সব হিসাব হবে স্বয়ংক্রিয়ভাবে। প্রতি মাসের
            চূড়ান্ত হিসাব সবাই এক জায়গায় দেখতে পারবে।
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              {loggedIn ? (
                <Link href="/admin">
                  ড্যাশবোর্ডে যান <ArrowRight />
                </Link>
              ) : (
                <Link href="/register">
                  বিনামূল্যে শুরু করুন <ArrowRight />
                </Link>
              )}
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/monthly-bill">হোস্টেলের হিসাব দেখুন</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">যা যা করা যায়</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
