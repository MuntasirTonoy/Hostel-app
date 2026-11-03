"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Eye,
  Info,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  UserMinus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/field-error";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberPicker } from "@/features/members/member-picker";
import { useI18n } from "@/i18n/client";
import { hundredthsToInput, mealCountToUnits, toAsciiDigits } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  accountFormSchema,
  formToCalcInputLenient,
  type AccountFormValues,
} from "@/schemas/accounting";
import type { CarryForwardResult } from "@/services/accounting-service";
import { MESSAGES } from "@/services/errors";
import type { MemberDTO, MonthlyAccountDTO } from "@/types/accounting";
import {
  createAccountWithValuesAction,
  deleteAccountAction,
  prepareNewMonthAction,
  publishAccountAction,
  saveDraftAction,
} from "./actions";
import { calculateMonthlyAccount } from "./calculate";
import { ConfirmAction } from "./confirm-button";
import { calcToReportData, type SummaryMetrics } from "./report-data";

/** Editing a saved record, or creating a new month directly from the full form. */
export type EditorMode =
  | { kind: "edit"; account: MonthlyAccountDTO }
  | {
      kind: "create";
      month: number;
      year: number;
      carryForward: CarryForwardResult;
      existingId: string | null;
    };

const EMPTY_EXPENSES = { marketExpense: "", riceExpense: "", fuelExpense: "", otherExtraExpense: "" };
const YEAR_PATTERN = /^20\d{2}$/;

function carryRows(carry: CarryForwardResult): AccountFormValues["members"] {
  return carry.members.map((m) => ({ ...m, investment: "", mealCount: "" }));
}

function initialValues(mode: EditorMode): AccountFormValues {
  if (mode.kind === "create") {
    return { managerName: "", members: carryRows(mode.carryForward), expenses: EMPTY_EXPENSES };
  }
  const { account } = mode;
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

const EXPENSE_FIELDS = ["marketExpense", "riceExpense", "fuelExpense", "otherExtraExpense"] as const;

export function AccountEditor({
  mode,
  registry: initialRegistry,
  hostelName,
  previous: initialPrevious,
}: {
  mode: EditorMode;
  registry: MemberDTO[];
  hostelName: string;
  /** The previous published month, compared against in the preview summary. */
  previous: SummaryMetrics | null;
}) {
  const router = useRouter();
  const { t, f, tm } = useI18n();
  const E = t.editor;
  const isCreate = mode.kind === "create";
  const [registry, setRegistry] = useState(initialRegistry);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"save" | "publish" | "delete" | null>(null);

  // Period: fixed when editing; selectable when creating.
  const [month, setMonth] = useState(mode.kind === "edit" ? mode.account.month : mode.month);
  const [yearText, setYearText] = useState(String(mode.kind === "edit" ? mode.account.year : mode.year));
  const yearValid = YEAR_PATTERN.test(toAsciiDigits(yearText.trim()));
  const year = Number(toAsciiDigits(yearText.trim()));
  const [existingId, setExistingId] = useState(mode.kind === "create" ? mode.existingId : null);
  const [loadingPeriod, startPeriodLoad] = useTransition();
  const [previous, setPrevious] = useState(initialPrevious);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: initialValues(mode),
    mode: "onChange",
  });
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "members",
    keyName: "key",
  });
  const watched = useWatch({ control: form.control }) as Partial<AccountFormValues>;

  // Live calculation using exactly the same module the server uses.
  const calcInput = formToCalcInputLenient(watched);
  const calc = { input: calcInput, result: calculateMonthlyAccount(calcInput) };
  const { summary } = calc.result;
  const managerName = watched.managerName ?? "";

  const errors = form.formState.errors;
  const memberErrors = errors.members;
  const listError = memberErrors?.root?.message ?? memberErrors?.message;

  /** Create mode: when the period changes, reload the carry-forward member list. */
  function changePeriod(nextMonth: number, nextYearText: string) {
    setMonth(nextMonth);
    setYearText(nextYearText);
    const ascii = toAsciiDigits(nextYearText.trim());
    if (!YEAR_PATTERN.test(ascii)) return;
    startPeriodLoad(async () => {
      const result = await prepareNewMonthAction(nextMonth, Number(ascii));
      if (!result.ok) return void toast.error(result.error);
      setExistingId(result.data.existingId);
      setPrevious(result.data.previous);
      if (!result.data.existingId) {
        replace(carryRows(result.data.carryForward));
        if (result.data.carryForward.members.length) toast.info(E.carryNotice);
      }
    });
  }

  function run(kind: "save" | "publish", values: AccountFormValues) {
    setPendingAction(kind);
    startTransition(async () => {
      if (mode.kind === "create") {
        const result = await createAccountWithValuesAction({ month, year }, values, kind === "publish");
        setPendingAction(null);
        if (!result.ok) {
          setServerErrors(result.details ?? [result.error]);
          return void toast.error(result.error);
        }
        toast.success(kind === "publish" ? E.createdPublished : E.savedDraft);
        router.push(`/admin/accounts/${result.data.id}`);
        return;
      }

      const id = mode.account.id;
      const result =
        kind === "save" ? await saveDraftAction(id, values) : await publishAccountAction(id, values);
      setPendingAction(null);
      if (!result.ok) {
        setServerErrors(result.details ?? [result.error]);
        return void toast.error(result.error);
      }
      setServerErrors([]);
      if (kind === "save") {
        form.reset(values);
        toast.success(E.savedDraft);
      } else {
        toast.success(E.published);
      }
      router.refresh();
    });
  }

  const periodProblem = !isCreate
    ? null
    : !yearValid
      ? E.yearInvalid
      : existingId
        ? E.periodExists
        : null;

  const save = form.handleSubmit(
    (values) => {
      if (periodProblem) return void toast.error(periodProblem);
      run("save", values);
    },
    () => toast.error(E.invalidForm),
  );

  const publishProblems = [
    ...(periodProblem ? [periodProblem] : []),
    ...(managerName.trim() ? [] : [tm(MESSAGES.MANAGER_REQUIRED)]),
    ...calc.result.issues.map((i) => tm(i.message)),
  ];

  const publish = form.handleSubmit(
    (values) => {
      if (publishProblems.length) {
        setServerErrors(publishProblems);
        return void toast.error(publishProblems[0]);
      }
      run("publish", values);
    },
    () => toast.error(E.invalidForm),
  );

  function deleteDraft() {
    if (mode.kind !== "edit") return;
    setPendingAction("delete");
    startTransition(async () => {
      const result = await deleteAccountAction(mode.account.id);
      setPendingAction(null);
      if (!result.ok) return void toast.error(result.error);
      toast.success(E.draftDeleted);
      router.push("/admin/accounts");
    });
  }

  const label = yearValid ? f.period(month, year) : "";
  const reportData = calcToReportData(calc.result, {
    month,
    year: yearValid ? year : 2000,
    managerName,
    expenses: calc.input.expenses,
  });
  const activeRegistry = registry.filter((m) => m.isActive);

  return (
    <form onSubmit={save} className="space-y-6">
      {/* A. মাসিক পরিচিতি */}
      <Card>
        <CardHeader>
          <CardTitle>{E.sectionA}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {isCreate ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="month">{E.month}</Label>
                <Select value={String(month)} onValueChange={(v) => changePeriod(Number(v), yearText)}>
                  <SelectTrigger id="month" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {f.months.map((name, i) => (
                      <SelectItem key={name} value={String(i + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">{E.year}</Label>
                <Input
                  id="year"
                  inputMode="numeric"
                  value={yearText}
                  aria-invalid={!yearValid}
                  onChange={(e) => changePeriod(month, e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{E.monthAndYear}</Label>
              <p className="flex h-9 items-center rounded-md border bg-muted/40 px-3 font-medium">{label}</p>
            </div>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="managerName">{E.managerName}</Label>
            <Input id="managerName" placeholder={E.managerPlaceholder} {...form.register("managerName")} />
            <FieldError message={errors.managerName?.message} />
          </div>
          {isCreate && !yearValid ? (
            <div className="sm:col-span-3">
              <FieldError message={E.yearInvalid} />
            </div>
          ) : null}
          {isCreate && existingId ? (
            <Alert className="sm:col-span-3">
              <Info />
              <AlertTitle>{E.existsTitle(label)}</AlertTitle>
              <AlertDescription>
                {E.existsDescription}{" "}
                <Link href={`/admin/accounts/${existingId}`} className="font-medium text-primary underline">
                  {E.openExisting}
                </Link>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {/* B. সদস্যদের তথ্য */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {E.sectionB}
            {loadingPeriod ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
          </CardTitle>
          <CardDescription>
            {E.memberCount(f.num(fields.length), f.num(activeRegistry.length))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">{E.columns.name}</th>
                  <th className="px-3 py-2.5 font-semibold">{E.columns.deposit}</th>
                  <th className="px-3 py-2.5 font-semibold">{E.columns.meals}</th>
                  <th className="px-3 py-2.5 text-right font-semibold">{E.columns.mealCost}</th>
                  <th className="px-3 py-2.5 text-right font-semibold">{E.columns.extra}</th>
                  <th className="px-3 py-2.5 text-right font-semibold">{E.columns.total}</th>
                  <th className="px-3 py-2.5 text-right font-semibold">{E.columns.balance}</th>
                  <th className="px-3 py-2.5">
                    <span className="sr-only">{E.columns.remove}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        {E.noMembers}
                        {activeRegistry.length > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              replace(
                                activeRegistry.map((m) => ({
                                  memberId: m.id,
                                  name: m.name,
                                  investment: "",
                                  mealCount: "",
                                })),
                              )
                            }
                          >
                            <Plus /> {E.addAllActive}
                          </Button>
                        ) : null}
                      </div>
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
                          placeholder={f.num(0)}
                          aria-label={E.depositOf(field.name)}
                          aria-invalid={!!rowErr?.investment}
                          className="w-32"
                          {...form.register(`members.${index}.investment`)}
                        />
                        <FieldError message={rowErr?.investment?.message} />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          inputMode="decimal"
                          placeholder={f.num(0)}
                          aria-label={E.mealsOf(field.name)}
                          aria-invalid={!!rowErr?.mealCount}
                          className="w-24"
                          {...form.register(`members.${index}.mealCount`)}
                        />
                        <FieldError message={rowErr?.mealCount?.message} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums leading-9">
                        {live ? f.amount(live.mealCost) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums leading-9">
                        {live ? f.amount(live.extraCost) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums leading-9">
                        {live ? f.amount(live.totalCost) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums leading-9">
                        {live && live.outstandingBalance > 0 ? (
                          <span className="font-semibold text-red-600">
                            {E.due} {f.amount(live.outstandingBalance)}
                          </span>
                        ) : live && live.refundAmount > 0 ? (
                          <span className="font-semibold text-emerald-700">
                            {E.refund} {f.amount(live.refundAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{f.amount(0)}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => remove(index)}
                          aria-label={E.removeMember(field.name)}
                          title={E.removeFromMonth}
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
          <CardTitle>{E.sectionC}</CardTitle>
          <CardDescription>{E.sectionCDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPENSE_FIELDS.map((name) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{E.expenseFields[name]}</Label>
              <Input
                id={name}
                inputMode="decimal"
                placeholder={f.num(0)}
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
          <CardTitle>{E.liveTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
            {[
              [E.live.totalMeals, t.common.meals(f.mealUnits(summary.totalMealUnits))],
              [E.live.foodCost, f.taka(summary.totalFoodCost)],
              [E.live.mealRate, summary.mealRate === null ? "—" : t.common.taka(f.amount(summary.mealRate))],
              [E.live.totalExtra, f.taka(summary.totalExtraCost)],
              [
                E.live.extraPerMember,
                summary.extraCostPerMember === null ? "—" : f.taka(summary.extraCostPerMember),
              ],
              [E.live.totalDeposits, f.taka(summary.totalDeposits)],
              [E.live.memberCost, f.taka(summary.totalMemberCost)],
              [E.live.dueRefund, `${f.taka(summary.totalOutstanding)} / ${f.taka(summary.totalRefund)}`],
            ].map(([itemLabel, value]) => (
              <div key={itemLabel} className="bg-background p-3">
                <dt className="text-xs text-muted-foreground">{itemLabel}</dt>
                <dd className={cn("mt-0.5 font-semibold tabular-nums", itemLabel === E.live.mealRate && "text-primary")}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {calc.result.issues.length > 0 ? (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle />
              <AlertTitle>{E.fixBeforePublish}</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                <ul className="list-disc pl-4">
                  {calc.result.issues.map((i) => (
                    <li key={i.code}>{tm(i.message)}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {serverErrors.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>{E.saveFailed}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {serverErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Action bar: sticks to the bottom of the screen while the form scrolls, then rests above the footer. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 backdrop-blur sm:-mx-6 lg:-mx-8">
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6 lg:px-8">
          {mode.kind === "edit" ? (
            <ConfirmAction
              destructive
              title={E.deleteDraftTitle}
              description={E.deleteDraftDescription}
              confirmLabel={t.common.delete}
              onConfirm={deleteDraft}
              trigger={
                <Button type="button" variant="ghost" className="mr-auto text-red-600" disabled={pending}>
                  {pendingAction === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  <span className="hidden sm:inline">{E.deleteDraft}</span>
                </Button>
              }
            />
          ) : null}
          <Button type="submit" variant="outline" disabled={pending || loadingPeriod || !!periodProblem}>
            {pendingAction === "save" ? <Loader2 className="animate-spin" /> : <Save />}
            {E.save}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
            <Eye /> {E.preview}
          </Button>
          <ConfirmAction
            title={E.publishTitle}
            description={
              publishProblems.length ? (
                <div className="space-y-2">
                  <p className="text-red-600">{E.notPublishable}</p>
                  <ul className="list-disc pl-4 text-red-600">
                    {publishProblems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>{E.publishDescription(label)}</p>
              )
            }
            confirmLabel={E.publishConfirm}
            onConfirm={publish}
            trigger={
              <Button type="button" disabled={pending || loadingPeriod}>
                {pendingAction === "publish" ? <Loader2 className="animate-spin" /> : <Send />}
                {E.publish}
              </Button>
            }
          />
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{E.previewTitle}</DialogTitle>
            <DialogDescription>{E.previewDescription}</DialogDescription>
          </DialogHeader>
          <ReportView report={reportData} hostelName={hostelName} previous={previous} />
        </DialogContent>
      </Dialog>
    </form>
  );
}
