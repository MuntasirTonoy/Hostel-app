"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Lets a visitor open a hostel's public report by its code (or a pasted link). */
export function HostelCodeForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Accept either the bare code or a full pasted link.
    const code = value.trim().toLowerCase().split("/monthly-bill/").pop()?.split("/")[0] ?? "";
    if (!/^[a-z0-9]{4,12}$/.test(code)) {
      setError("সঠিক হোস্টেল কোড লিখুন।");
      return;
    }
    setError(null);
    router.push(`/monthly-bill/${code}`);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="হোস্টেল কোড"
          aria-label="হোস্টেল কোড"
          className="font-mono"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <Button type="submit">
          <Search /> দেখুন
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
