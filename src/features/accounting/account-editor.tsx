"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Eye,
  Loader2,
  Save,
  Send,
  Trash2,
  UserMinus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ReportView } from "@/components/report/report-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberPicker } from "@/features/members/member-picker";
import { cn } from "@/lib/utils";
import { formatAmount, formatTaka, hundredthsToInput, mealCountToUnits, toBanglaDigits, formatMealUnits } from "@/lib/money";
import { periodLabel } from "@/lib/months";
import {
  accountFormSchema,
  formToCalcInputLenient,
  type AccountFormValues,
} from "@/schemas/accounting";
import type { MemberDTO, MonthlyAccountDTO } from "@/types/accounting";
import { deleteAccountAction, publishAccountAction, saveDraftAction } from "./actions";
import { calculateMonthlyAccount } from "./calculate";
import { ConfirmAction } from "./confirm-button";
import { FieldError } from "./new-month-form";
import { calcToReportData } from "./report-data";

function toFormValues(account: MonthlyAccountDTO): AccountFormValues {
  return {
    managerName: account.managerName,
    members: account.members.map((m) => ({
      memberId: m.memberId,
      name: m.name,
      investment: hundredthsToInput(m.investment),
      mealCount: hundredthsToInput(mealCountToUnits(m.mealCount)),
    })),
    expenses: {
      marketExpense: hundredthsToInput(account.expenses.marketExpense),
      riceExpense: hundredthsToInput(account.expenses.riceExpense),
      fuelExpense: hundredthsToInput(account.expenses.fuelExpense),
      otherExtraExpense: hundredthsToInput(account.expenses.otherExtraExpense),
    },
  };
}

const EXPENSE_FIELDS = [
  { name: "marketExpense", label: "বাজার খরচ (৳)" },
  { name: "riceExpense", label: "চালের খরচ (৳)" },
  { name: "fuelExpense", label: "জ্বালানি খরচ (৳)" },
  { name: "otherExtraExpense", label: "অন্যান্য অতিরিক্ত খরচ (৳)" },
] as const;

export function AccountEditor({
  account,
  registry: initialRegistry,
  hostelName,
}: {
  account: MonthlyAccountDTO;
  registry: MemberDTO[];
  hostelName: string;
}) {
  const router = useRouter();
  const [registry, setRegistry] = useState(initialRegistry);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"save" | "publish" | "delete" | null>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: toFormValues(account),
    mode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "members", keyName: "key" });
  const watched = useWatch({ control: form.control }) as Partial<AccountFormValues>;

  // Live calculation using exactly the same module the server uses.
  const calcInput = formToCalcInputLenient(watched);
  const calc = { input: calcInput, result: calculateMonthlyAccount(calcInput) };
  const { summary } = calc.result;
  const managerName = watched.managerName ?? "";

  const errors = form.formState.errors;
  const memberErrors = errors.members;
  const listError = memberErrors?.root?.message ?? memberErrors?.message;

  function run(kind: "save" | "publish", values: AccountFormValues) {
    setPendingAction(kind);
    startTransition(async () => {
      const result =
        kind === "save"
          ? await saveDraftAction(account.id, values)
          : await publishAccountAction(account.id, values);
      setPendingAction(null);
      if (!result.ok) {
        setServerErrors(result.details ?? [result.error]);
        toast.error(result.error);
        return;
      }
      setServerErrors([]);
      if (kind === "save") {
        form.reset(values);
        toast.success("হিসাব খসড়া হিসেবে সংরক্ষণ করা হয়েছে। এটি এখনো প্রকাশিত হয়নি।");
      } else {
        toast.success("মাসিক হিসাব প্রকাশ করা হয়েছে। এখন এটি /monthly-bill পাতায় দেখা যাবে।");
      }
      router.refresh();
    });
  }

  const save = form.handleSubmit((values) => run("save", values), () =>
    toast.error("ফর্মে কিছু ভুল আছে। লাল চিহ্নিত ঘরগুলো ঠিক করুন।"),
  );

  const publishProblems = [
    ...(managerName.trim() ? [] : ["হিসাব প্রকাশের আগে ম্যানেজারের নাম লিখুন।"]),
    ...calc.result.issues.map((i) => i.message),
  ];

  const publish = form.handleSubmit(
    (values) => {
      if (publishProblems.length) {
        setServerErrors(publishProblems);
        toast.error(publishProblems[0]);
        return;
      }
      run("publish", values);
    },
    () => toast.error("ফর্মে কিছু ভুল আছে। লাল চিহ্নিত ঘরগুলো ঠিক করুন।"),
  );

  function deleteDraft() {
    setPendingAction("delete");
    startTransition(async () => {
      const result = await deleteAccountAction(account.id);
      setPendingAction(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("খসড়া হিসাবটি মুছে ফেলা হয়েছে।");
      router.push("/admin/accounts");
    });
  }

  const reportData = calcToReportData(calc.result, {
    month: account.month,
    year: account.year,
    managerName,
    expenses: calc.input.expenses,
  });

  return (
    <form onSubmit={save} className="space-y-6 pb-24">
      {/* A. মাসিক পরিচিতি */}
      <Card>
        <CardHeader>
          <CardTitle>ক. মাসিক পরিচিতি</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>মাসের নাম ও বছর</Label>
            <p className="flex h-9 items-center rounded-md border bg-muted/40 px-3 font-medium">
              {periodLabel(account.month, account.year)}
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="managerName">ম্যানেজারের নাম</Label>
            <Input id="managerName" placeholder="যেমন: রহিম উদ্দিন" {...form.register("managerName")} />
            <FieldError message={errors.managerName?.message} />
          </div>
        </CardContent>
      </Card>

      {/* B. সদস্যদের তথ্য */}
      <Card>
        <CardHeader>
          <CardTitle>খ. সদস্যদের তথ্য</CardTitle>
          <CardDescription>
            মোট সদস্য: {toBanglaDigits(fields.length)} জন। কোনো সদস্যকে বাদ দিলে শুধু এই মাসের হিসাব থেকে বাদ যাবেন —
            স্থায়ী সদস্য তালিকা ও আগের হিসাব অপরিবর্তিত থাকবে।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">সদস্যের নাম</th>
                  <th className="px-3 py-2.5 font-semibold">এই মাসে জমা (৳)</th>
                  <th className="px-3 py-2.5 font-semibold">এই মাসে মোট মিল</th>
                  <th className="px-3 py-2.5 text-right font-semibold">মিলের খরচ</th>
                  <th className="px-3 py-2.5 text-right font-semibold">অতিরিক্ত</th>
                  <th className="px-3 py-2.5 text-right font-semibold">মোট খরচ</th>
                  <th className="px-3 py-2.5 text-right font-semibold">বকেয়া / ফেরত</th>
                  <th className="px-3 py-2.5">
                    <span className="sr-only">বাদ দিন</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      কোনো সদস্য নেই। নিচে থেকে সদস্য যোগ করুন।
                    </td>
                  </tr>
                ) : null}
                {fields.map((field, index) => {
                  const live = calc.result.members[index];
                  const rowErr = memberErrors?.[index];
                  return (
                    <tr key={field.key} className="border-t align-top">
                      <td className="px-3 py-2 font-medium">
                        <span className="flex h-9 items-center">{field.name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          inputMode="decimal"
                          placeholder="০"
                          aria-label={`${field.name} এর জমা`}
                          aria-invalid={!!rowErr?.investment}
                          className="w-32"
                          {...form.register(`members.${index}.investment`)}
                        />
                        <FieldError message={rowErr?.investment?.message} />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          inputMode="decimal"
                          placeholder="০"
                          aria-label={`${field.name} এর মিল সংখ্যা`}
                          aria-invalid={!!rowErr?.mealCount}
                          className="w-24"
                          {...form.register(`members.${index}.mealCount`)}
                        />
                        <FieldError message={rowErr?.mealCount?.message} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums leading-9">
                        {live ? formatAmount(live.mealCost) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums leading-9">
                        {live ? formatAmount(live.extraCost) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums leading-9">
                        {live ? formatAmount(live.totalCost) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums leading-9">
                        {live && live.outstandingBalance > 0 ? (
                          <span className="font-semibold text-red-600">
                            বকেয়া {formatAmount(live.outstandingBalance)}
                          </span>
                        ) : live && live.refundAmount > 0 ? (
                          <span className="font-semibold text-emerald-700">
                            ফেরত {formatAmount(live.refundAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">০.০০</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => remove(index)}
                          aria-label={`${field.name} কে এই মাসের হিসাব থেকে বাদ দিন`}
                          title="এই মাসের হিসাব থেকে বাদ দিন"
                        >
                          <UserMinus />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <FieldError message={listError} />
          <MemberPicker
            registry={registry}
            selectedIds={(watched.members ?? []).map((m) => m?.memberId ?? "")}
            onAdd={(m) => append({ ...m, investment: "", mealCount: "" })}
            onRegistryChange={(m) => setRegistry((prev) => [...prev, m])}
          />
        </CardContent>
      </Card>

      {/* C. মাসিক খরচ */}
      <Card>
        <CardHeader>
          <CardTitle>গ. মাসিক খরচ</CardTitle>
          <CardDescription>
            বাজার ও চালের খরচ মিল অনুযায়ী ভাগ হবে; জ্বালানি ও অন্যান্য খরচ সকল সদস্যের মধ্যে সমানভাবে ভাগ হবে।
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPENSE_FIELDS.map(({ name, label }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                inputMode="decimal"
                placeholder="০"
                aria-invalid={!!errors.expenses?.[name]}
                {...form.register(`expenses.${name}`)}
              />
              <FieldError message={errors.expenses?.[name]?.message} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live summary */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>স্বয়ংক্রিয় হিসাব (লাইভ প্রিভিউ)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
            {[
              ["মোট মিল", `${formatMealUnits(summary.totalMealUnits)}টি`],
              ["মোট খাবারের খরচ", formatTaka(summary.totalFoodCost)],
              ["মিল রেট", summary.mealRate === null ? "—" : `${formatAmount(summary.mealRate)} টাকা`],
              ["মোট অতিরিক্ত খরচ", formatTaka(summary.totalExtraCost)],
              [
                "জনপ্রতি অতিরিক্ত খরচ",
                summary.extraCostPerMember === null ? "—" : formatTaka(summary.extraCostPerMember),
              ],
              ["মোট জমা", formatTaka(summary.totalDeposits)],
              ["সদস্যদের মোট খরচ", formatTaka(summary.totalMemberCost)],
              ["মোট বকেয়া / মোট ফেরত", `${formatTaka(summary.totalOutstanding)} / ${formatTaka(summary.totalRefund)}`],
            ].map(([label, value]) => (
              <div key={label} className="bg-background p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className={cn("mt-0.5 font-semibold tabular-nums", label === "মিল রেট" && "text-primary")}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {calc.result.issues.length > 0 ? (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle />
              <AlertTitle>প্রকাশের আগে ঠিক করতে হবে</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                <ul className="list-disc pl-4">
                  {calc.result.issues.map((i) => (
                    <li key={i.code}>{i.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {serverErrors.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>হিসাব সংরক্ষণ বা প্রকাশ করা যায়নি</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {serverErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur lg:left-64">
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <ConfirmAction
            destructive
            title="খসড়া হিসাবটি মুছে ফেলবেন?"
            description="এই মাসের খসড়া হিসাবটি স্থায়ীভাবে মুছে যাবে। সদস্য তালিকা অপরিবর্তিত থাকবে।"
            confirmLabel="মুছে ফেলুন"
            onConfirm={deleteDraft}
            trigger={
              <Button type="button" variant="ghost" className="mr-auto text-red-600" disabled={pending}>
                {pendingAction === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />}
                <span className="hidden sm:inline">খসড়া মুছুন</span>
              </Button>
            }
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {pendingAction === "save" ? <Loader2 className="animate-spin" /> : <Save />}
            হিসাব সংরক্ষণ করুন
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
            <Eye /> হিসাব প্রিভিউ দেখুন
          </Button>
          <ConfirmAction
            title="মাসিক হিসাব প্রকাশ করবেন?"
            description={
              publishProblems.length ? (
                <div className="space-y-2">
                  <p className="text-red-600">হিসাবটি এখনো প্রকাশযোগ্য নয়:</p>
                  <ul className="list-disc pl-4 text-red-600">
                    {publishProblems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>
                  প্রকাশের পর {periodLabel(account.month, account.year)} মাসের হিসাব সবার জন্য দৃশ্যমান হবে এবং চূড়ান্ত
                  হিসেবে গণ্য হবে। পরে পরিবর্তন করতে হলে আগে অপ্রকাশিত করতে হবে।
                </p>
              )
            }
            confirmLabel="প্রকাশ করুন"
            onConfirm={publish}
            trigger={
              <Button type="button" disabled={pending}>
                {pendingAction === "publish" ? <Loader2 className="animate-spin" /> : <Send />}
                মাসিক হিসাব প্রকাশ করুন
              </Button>
            }
          />
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>হিসাব প্রিভিউ</DialogTitle>
            <DialogDescription>প্রকাশের পর পাবলিক পাতায় হিসাবটি এভাবে দেখা যাবে।</DialogDescription>
          </DialogHeader>
          <ReportView report={reportData} hostelName={hostelName} />
        </DialogContent>
      </Dialog>
    </form>
  );
}
