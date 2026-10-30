"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/accounting/new-month-form";
import { hostelSettingsSchema } from "@/schemas/auth";
import { updateHostelAction } from "./actions";

export function SettingsForms({ hostelName }: { hostelName: string }) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const form = useForm<z.infer<typeof hostelSettingsSchema>>({
    resolver: zodResolver(hostelSettingsSchema),
    defaultValues: { name: hostelName },
  });

  const save = form.handleSubmit((values) =>
    startSaving(async () => {
      const result = await updateHostelAction(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success("হোস্টেলের নাম সংরক্ষণ করা হয়েছে।");
      router.refresh();
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>হোস্টেলের তথ্য</CardTitle>
        <CardDescription>হোস্টেলের নাম মাসিক হিসাব ও প্রিন্টে দেখানো হবে।</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hostelName">হোস্টেলের নাম</Label>
            <Input id="hostelName" placeholder="যেমন: শাপলা ছাত্রাবাস" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} সংরক্ষণ করুন
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
