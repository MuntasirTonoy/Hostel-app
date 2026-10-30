"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/accounting/new-month-form";
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/auth";
import { updateProfileAction } from "./actions";

/** Edits the signed-in user's name and email (email change needs the current password). */
export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name, email, currentPassword: "" },
  });
  const newEmail = useWatch({ control: form.control, name: "email" });
  const emailChanged = newEmail.trim().toLowerCase() !== email;

  const submit = form.handleSubmit((values) =>
    startSaving(async () => {
      const result = await updateProfileAction(values);
      if (!result.ok) return void toast.error(result.error);
      form.reset({ name: result.data.name, email: result.data.email, currentPassword: "" });
      toast.success(
        emailChanged
          ? "প্রোফাইল হালনাগাদ হয়েছে। পরেরবার নতুন ইমেইল দিয়ে লগইন করুন।"
          : "প্রোফাইল হালনাগাদ হয়েছে।",
      );
      router.refresh();
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>ব্যক্তিগত তথ্য</CardTitle>
        <CardDescription>আপনার নাম ও লগইন ইমেইল।</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">নাম</Label>
            <Input id="profile-name" autoComplete="name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">ইমেইল</Label>
            <Input id="profile-email" type="email" autoComplete="email" {...form.register("email")} />
            <FieldError message={form.formState.errors.email?.message} />
          </div>
          {emailChanged ? (
            <div className="space-y-2">
              <Label htmlFor="profile-password">বর্তমান পাসওয়ার্ড (ইমেইল পরিবর্তনের জন্য)</Label>
              <Input
                id="profile-password"
                type="password"
                autoComplete="current-password"
                {...form.register("currentPassword")}
              />
            </div>
          ) : null}
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} সংরক্ষণ করুন
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
