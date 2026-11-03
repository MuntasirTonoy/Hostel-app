"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { HOSTEL_ID_PATTERN } from "@/schemas/auth";

/** Lets a visitor open a hostel's public report by its Hostel ID (or a pasted link). */
export function HostelCodeForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Accept either the bare ID or a full pasted link.
    const id = value.trim().toLowerCase().split("/monthly-bill/").pop()?.split(/[/?#]/)[0] ?? "";
    if (!HOSTEL_ID_PATTERN.test(id)) {
      setError(t.billLookup.invalid);
      return;
    }
    setError(null);
    router.push(`/monthly-bill/${id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.billLookup.placeholder}
          aria-label={t.billLookup.placeholder}
          className="font-mono"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <Button type="submit">
          <Search /> {t.billLookup.view}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
