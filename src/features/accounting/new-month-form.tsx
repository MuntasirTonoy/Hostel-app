"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { History, Info, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberPicker } from "@/features/members/member-picker";
import { toAsciiDigits, toBanglaDigits } from "@/lib/money";
import { BANGLA_MONTHS, periodLabel } from "@/lib/months";
import type { MemberDTO } from "@/types/accounting";
import {
  createMonthlyAccountAction,
  prepareNewMonthAction,
  type PrepareNewMonthResult,
} from "./actions";

export const CARRY_FORWARD_NOTICE = "পূর্ববর্তী মাসের সদস্যদের তালিকা স্বয়ংক্রিয়ভাবে যুক্ত করা হয়েছে।";

const formSchema = z.object({
  month: z.string().regex(/^(?:[1-9]|1[0-2])$/, "মাস নির্বাচন করুন।"),
  year: z
    .string()
    .transform((s) => toAsciiDigits(s.trim()))
    .pipe(z.string().regex(/^20\d{2}$/, "সঠিক বছর লিখুন (যেমন ২০২৬)।")),
  managerName: z.string().trim().max(100, "ম্যানেজারের নাম অনেক বড়।"),
});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

type Row = { memberId: string; name: string };

export function NewMonthForm({
  registry: initialRegistry,
  defaultMonth,
  defaultYear,
}: {
  registry: MemberDTO[];
  defaultMonth: number;
  defaultYear: number;
}) {
  const router = useRouter();
  const [registry, setRegistry] = useState(initialRegistry);
  const [rows, setRows] = useState<Row[]>([]);
  const [lookup, setLookup] = useState<PrepareNewMonthResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loading, startLookup] = useTransition();
  const [creating, startCreate] = useTransition();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: { month: String(defaultMonth), year: String(defaultYear), managerName: "" },
  });
  const month = useWatch({ control: form.control, name: "month" });
  const year = toAsciiDigits(useWatch({ control: form.control, name: "year" }) ?? "");

  // Whenever the period changes, look up the carry-forward members.
  useEffect(() => {
    const m = Number(month);
    const y = Number(year);
    if (!(m >= 1 && m <= 12) || !/^20\d{2}$/.test(year)) return;
    startLookup(async () => {
      const result = await prepareNewMonthAction(m, y);
      if (!result.ok) {
        setLookup(null);
        setLookupError(result.error);
        return;
      }
      setLookupError(null);
      setLookup(result.data);
      setRows(result.data.carryForward.members);
      if (result.data.carryForward.members.length > 0 && !result.data.existingId) {
        toast.info(CARRY_FORWARD_NOTICE);
      }
    });
  }, [month, year]);

  const onSubmit = form.handleSubmit((values) => {
    if (rows.length === 0) {
      toast.error("কমপক্ষে একজন সদস্য যুক্ত করুন।");
      return;
    }
    startCreate(async () => {
      const result = await createMonthlyAccountAction({
        month: Number(values.month),
        year: Number(values.year),
        managerName: values.managerName,
        memberIds: rows.map((r) => r.memberId),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("নতুন মাসের হিসাব তৈরি হয়েছে। এখন জমা, মিল ও খরচ লিখুন।");
      router.push(`/admin/accounts/${result.data.id}`);
    });
  });

  const carry = lookup?.carryForward;
  const existingId = lookup?.existingId;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>মাসিক পরিচিতি</CardTitle>
          <CardDescription>মাস ও বছর নির্বাচন করুন। প্রতিটি মাসের জন্য একটিমাত্র হিসাব তৈরি করা যায়।</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="month">মাসের নাম</Label>
            <Controller
              control={form.control}
              name="month"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="month" className="w-full">
                    <SelectValue placeholder="মাস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANGLA_MONTHS.map((name, i) => (
                      <SelectItem key={name} value={String(i + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={form.formState.errors.month?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">বছর</Label>
            <Input id="year" inputMode="numeric" {...form.register("year")} />
            <FieldError message={form.formState.errors.year?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="managerName">ম্যানেজারের নাম</Label>
            <Input id="managerName" placeholder="যেমন: রহিম উদ্দিন" {...form.register("managerName")} />
            <FieldError message={form.formState.errors.managerName?.message} />
          </div>
        </CardContent>
      </Card>

      {lookupError ? (
        <Alert variant="destructive">
          <AlertDescription>{lookupError}</AlertDescription>
        </Alert>
      ) : null}

      {existingId ? (
        <Alert>
          <Info />
          <AlertTitle>
            {periodLabel(Number(month), Number(year))} মাসের হিসাব ইতোমধ্যে তৈরি করা হয়েছে
          </AlertTitle>
          <AlertDescription>
            একই মাসের জন্য দ্বিতীয় হিসাব তৈরি করা যাবে না।{" "}
            <Link href={`/admin/accounts/${existingId}`} className="font-medium text-primary underline">
              বিদ্যমান হিসাবটি খুলুন
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              সদস্যদের তালিকা
              {loading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
            </CardTitle>
            <CardDescription>
              এই মাসের হিসাবে অন্তর্ভুক্ত সদস্য: {toBanglaDigits(rows.length)} জন। জমা ও মিল সংখ্যা পরের ধাপে লিখবেন।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {carry?.source && carry.members.length > 0 ? (
              <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
                <History />
                <AlertTitle>{CARRY_FORWARD_NOTICE}</AlertTitle>
                <AlertDescription className="text-orange-800 dark:text-orange-300">
                  উৎস: {periodLabel(carry.source.month, carry.source.year)}। শুধু সদস্যদের নাম আনা হয়েছে —
                  আগের মাসের জমা, মিল বা খরচ নয়।
                  {carry.skipped.length > 0
                    ? ` নিষ্ক্রিয় ${toBanglaDigits(carry.skipped.length)} জন সদস্য বাদ দেওয়া হয়েছে।`
                    : ""}
                </AlertDescription>
              </Alert>
            ) : carry && !loading ? (
              <Alert>
                <Info />
                <AlertTitle>পূর্ববর্তী মাসের কোনো হিসাব পাওয়া যায়নি</AlertTitle>
                <AlertDescription>
                  নিচে থেকে নিবন্ধিত সদস্য নির্বাচন করুন অথবা নতুন সদস্য যুক্ত করুন।
                  {registry.some((m) => m.isActive) ? (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0"
                      onClick={() =>
                        setRows(
                          registry
                            .filter((m) => m.isActive)
                            .map((m) => ({ memberId: m.id, name: m.name })),
                        )
                      }
                    >
                      <Plus className="size-3" /> সকল সক্রিয় সদস্য যুক্ত করুন
                    </Button>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}

            {rows.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {rows.map((r) => (
                  <li
                    key={r.memberId}
                    className="flex items-center gap-1 rounded-full border bg-muted/40 py-1 pl-3 pr-1 text-sm"
                  >
                    {r.name}
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((p) => p.memberId !== r.memberId))}
                      className="rounded-full p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600"
                      aria-label={`${r.name} কে এই মাসের হিসাব থেকে বাদ দিন`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <MemberPicker
              registry={registry}
              selectedIds={rows.map((r) => r.memberId)}
              onAdd={(m) =>
                setRows((prev) => (prev.some((p) => p.memberId === m.memberId) ? prev : [...prev, m]))
              }
              onRegistryChange={(m) => setRegistry((prev) => [...prev, m])}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={creating || loading || !!existingId}>
          {creating ? <Loader2 className="animate-spin" /> : null}
          নতুন মাসের হিসাব তৈরি করুন
        </Button>
      </div>
    </form>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-600">{message}</p> : null;
}
