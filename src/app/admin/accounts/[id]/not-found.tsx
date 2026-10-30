import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccountNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-xl font-semibold">হিসাবটি খুঁজে পাওয়া যায়নি</h1>
      <Button asChild>
        <Link href="/admin/accounts">মাসিক হিসাবসমূহে ফিরে যান</Link>
      </Button>
    </div>
  );
}
