"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/field-error";
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/auth";
import { checkEmailAvailableAction, updateProfileAction } from "./actions";

type EmailStatus = "checking" | "available" | "taken" | "invalid";

/**
 * Edits the signed-in user's name and email. When the email changes, it is
 * first checked for availability; only a free email asks for the current password.
 */
export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name, email, currentPassword: "" },
  });
  const newEmail = useWatch({ control: form.control, name: "email" }).trim().toLowerCase();
  const emailChanged = newEmail !== email;

  const formatValid = updateProfileSchema.shape.email.safeParse(newEmail).success;

  // Result of the last server availability check, keyed by the email it was for.
  const [check, setCheck] = useState<{ email: string; available: boolean } | null>(null);
  const status: EmailStatus | null = !emailChanged
    ? null
    : !formatValid
      ? "invalid"
      : check?.email === newEmail
        ? check.available
          ? "available"
          : "taken"
        : "checking";

  useEffect(() => {
    if (!emailChanged || !formatValid) return;
    let cancelled = false;
    // Debounce so we only check once typing pauses.
    const timer = setTimeout(async () => {
      const result = await checkEmailAvailableAction(newEmail);
      if (cancelled) return;
      if (!result.ok) return void toast.error(result.error);
      setCheck({ email: newEmail, available: result.data.available });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [newEmail, emailChanged, formatValid]);

  const submit = form.handleSubmit((values) => {
    if (emailChanged && status !== "available") {
      toast.error(
        status === "taken" ? "এই ইমেইল দিয়ে অন্য একটি অ্যাকাউন্ট আছে।" : "নতুন ইমেইল যাচাই করা হচ্ছে, একটু অপেক্ষা করুন।",
      );
      return;
    }
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
    });
  });

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
            <Input
              id="profile-email"
              type="email"
              autoComplete="email"
              aria-invalid={status === "taken" || status === "invalid"}
              aria-describedby="profile-email-status"
              {...form.register("email")}
            />
            <p id="profile-email-status" aria-live="polite" className="text-sm">
              {status === "checking" ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> ইমেইল যাচাই করা হচ্ছে…
                </span>
              ) : status === "available" ? (
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-3.5" /> এই ইমেইল ব্যবহার করা যাবে।
                </span>
              ) : status === "taken" ? (
                <span className="flex items-center gap-1.5 text-red-600">
                  <XCircle className="size-3.5" /> এই ইমেইল দিয়ে অন্য একটি অ্যাকাউন্ট আছে।
                </span>
              ) : status === "invalid" ? (
                <span className="text-red-600">সঠিক ইমেইল ঠিকানা লিখুন।</span>
              ) : null}
            </p>
          </div>
          {status === "available" ? (
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
          <Button
            type="submit"
            disabled={saving || (emailChanged && status !== "available")}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save />} সংরক্ষণ করুন
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
