"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MemberDTO } from "@/types/accounting";
import { createMemberAction } from "./actions";

/**
 * Adds members to a monthly record: either an existing registry member or a
 * brand-new member (created in the permanent registry first).
 */
export function MemberPicker({
  registry,
  selectedIds,
  onAdd,
  onRegistryChange,
}: {
  registry: MemberDTO[];
  selectedIds: string[];
  onAdd: (member: { memberId: string; name: string }) => void;
  onRegistryChange?: (member: MemberDTO) => void;
}) {
  const [newName, setNewName] = useState("");
  const [selectKey, setSelectKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const available = registry.filter((m) => m.isActive && !selectedIds.includes(m.id));

  function createAndAdd() {
    const name = newName.trim();
    if (!name) {
      toast.error("নতুন সদস্যের নাম লিখুন।");
      return;
    }
    startTransition(async () => {
      const result = await createMemberAction({ name });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onRegistryChange?.(result.data);
      onAdd({ memberId: result.data.id, name: result.data.name });
      setNewName("");
      toast.success(`"${result.data.name}" সদস্য তালিকায় যুক্ত হয়েছে।`);
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Select
        key={selectKey}
        disabled={available.length === 0}
        onValueChange={(id) => {
          const m = registry.find((r) => r.id === id);
          if (m) onAdd({ memberId: m.id, name: m.name });
          setSelectKey((k) => k + 1);
        }}
      >
        <SelectTrigger className="w-full" aria-label="সদস্য যোগ করুন">
          <SelectValue
            placeholder={
              available.length ? "নিবন্ধিত সদস্য যোগ করুন" : "যোগ করার মতো আর কোনো সক্রিয় সদস্য নেই"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {available.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="নতুন সদস্যের নাম"
          aria-label="নতুন সদস্যের নাম"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createAndAdd();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={createAndAdd} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
          নতুন সদস্য
        </Button>
      </div>
    </div>
  );
}
