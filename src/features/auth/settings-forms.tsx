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
import { FieldError } from "@/components/field-error";
import { useI18n } from "@/i18n/client";
import { hostelSettingsSchema } from "@/schemas/auth";
import { updateHostelAction } from "./actions";

export function SettingsForms({ hostelName }: { hostelName: string }) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const { t } = useI18n();
  const h = t.profile.hostel;
  const form = useForm<z.infer<typeof hostelSettingsSchema>>({
    resolver: zodResolver(hostelSettingsSchema),
    defaultValues: { name: hostelName },
  });

  const save = form.handleSubmit((values) =>
    startSaving(async () => {
      const result = await updateHostelAction(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success(h.saved);
      router.refresh();
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{h.title}</CardTitle>
        <CardDescription>{h.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hostelName">{h.name}</Label>
            <Input id="hostelName" placeholder={h.placeholder} {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {t.common.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
