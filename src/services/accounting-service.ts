import { Types } from "mongoose";
import { calculateMonthlyAccount } from "@/features/accounting/calculate";
import { mealCountToUnits, unitsToMealCount } from "@/lib/money";
import { connectDB } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { MonthlyAccount } from "@/models/MonthlyAccount";
import {
  accountFormSchema,
  formToCalcInput,
  newMonthSchema,
  periodSchema,
  type AccountFormValues,
  type NewMonthInput,
} from "@/schemas/accounting";
import type {
  AccountStatus,
  CalcIssue,
  CalcMemberInput,
  CalcResult,
  Expenses,
  MonthlyAccountDTO,
  PeriodRef,
} from "@/types/accounting";
import { MESSAGES, ServiceError } from "./errors";
import { parseOrThrow } from "./validation";

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

type MonthlyMemberLean = {
  memberId: Types.ObjectId;
  name: string;
  investment: number;
  mealCount: number;
  mealCost: number;
  extraCost: number;
  totalCost: number;
  outstandingBalance: number;
  refundAmount: number;
};

type MonthlyAccountLean = {
  _id: Types.ObjectId;
  month: number;
  year: number;
  managerName: string;
  members: MonthlyMemberLean[];
  expenses: Expenses;
  mealRate: number | null;
  totalMembers: number;
  totalMeals: number;
  totalDeposits: number;
  totalFoodCost: number;
  totalExtraCost: number;
  extraCostPerMember: number | null;
  totalMemberCost: number;
  status: AccountStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toAccountDTO(doc: MonthlyAccountLean): MonthlyAccountDTO {
  return {
    id: String(doc._id),
    month: doc.month,
    year: doc.year,
    managerName: doc.managerName ?? "",
    members: doc.members.map((m) => ({
      memberId: String(m.memberId),
      name: m.name,
      investment: m.investment,
      mealCount: m.mealCount,
      mealCost: m.mealCost,
      extraCost: m.extraCost,
      totalCost: m.totalCost,
      outstandingBalance: m.outstandingBalance,
      refundAmount: m.refundAmount,
    })),
    expenses: {
      marketExpense: doc.expenses?.marketExpense ?? 0,
      riceExpense: doc.expenses?.riceExpense ?? 0,
      fuelExpense: doc.expenses?.fuelExpense ?? 0,
      otherExtraExpense: doc.expenses?.otherExtraExpense ?? 0,
    },
    mealRate: doc.mealRate ?? null,
    totalMembers: doc.totalMembers,
    totalMeals: doc.totalMeals,
    totalDeposits: doc.totalDeposits,
    totalFoodCost: doc.totalFoodCost,
    totalExtraCost: doc.totalExtraCost,
    extraCostPerMember: doc.extraCostPerMember ?? null,
    totalMemberCost: doc.totalMemberCost,
    status: doc.status,
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Turns a calculation result into the persisted snapshot fields. */
function snapshotFields(calc: CalcResult, expenses: Expenses) {
  return {
    members: calc.members.map((m) => ({
      memberId: new Types.ObjectId(m.memberId),
      name: m.name,
      investment: m.investment,
      mealCount: unitsToMealCount(m.mealUnits),
      mealCost: m.mealCost,
      extraCost: m.extraCost,
      totalCost: m.totalCost,
      outstandingBalance: m.outstandingBalance,
      refundAmount: m.refundAmount,
    })),
    expenses,
    mealRate: calc.summary.mealRate,
    totalMembers: calc.summary.totalMembers,
    totalMeals: unitsToMealCount(calc.summary.totalMealUnits),
    totalDeposits: calc.summary.totalDeposits,
    totalFoodCost: calc.summary.totalFoodCost,
    totalExtraCost: calc.summary.totalExtraCost,
    extraCostPerMember: calc.summary.extraCostPerMember,
    totalMemberCost: calc.summary.totalMemberCost,
  };
}

/** Rebuilds calculation input from a stored record (used for re-verification). */
export function accountToCalcInput(account: MonthlyAccountDTO): {
  members: CalcMemberInput[];
  expenses: Expenses;
} {
  return {
    members: account.members.map((m) => ({
      memberId: m.memberId,
      name: m.name,
      investment: m.investment,
      mealUnits: mealCountToUnits(m.mealCount),
    })),
    expenses: account.expenses,
  };
}

function assertObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) throw new ServiceError("NOT_FOUND", MESSAGES.ACCOUNT_NOT_FOUND);
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

const periodSort = { year: -1, month: -1 } as const;

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/*
 * Every function takes the hostelId of the caller (or of the public report
 * being viewed) and filters by it, so hostels are fully isolated.
 */

export async function getAccountById(
  hostelId: string,
  id: string,
): Promise<MonthlyAccountDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const doc = await MonthlyAccount.findOne({ _id: id, hostelId }).lean<MonthlyAccountLean>();
  return doc ? toAccountDTO(doc) : null;
}

export async function getAccountByPeriod(
  hostelId: string,
  month: number,
  year: number,
  options: { publishedOnly?: boolean } = {},
): Promise<MonthlyAccountDTO | null> {
  await connectDB();
  const filter: Record<string, unknown> = { hostelId, month, year };
  if (options.publishedOnly) filter.status = "PUBLISHED";
  const doc = await MonthlyAccount.findOne(filter).lean<MonthlyAccountLean>();
  return doc ? toAccountDTO(doc) : null;
}

/** All records of a hostel (drafts included), newest period first. Admin only. */
export async function listAccounts(hostelId: string): Promise<MonthlyAccountDTO[]> {
  await connectDB();
  const docs = await MonthlyAccount.find({ hostelId }).sort(periodSort).lean<MonthlyAccountLean[]>();
  return docs.map(toAccountDTO);
}

/**
 * The latest *published* report, chosen by accounting period (year, month) —
 * not by insertion order or publish time — so publishing an older correction
 * never hides the newest month.
 */
export async function getLatestPublishedAccount(
  hostelId: string,
): Promise<MonthlyAccountDTO | null> {
  await connectDB();
  const doc = await MonthlyAccount.findOne({ hostelId, status: "PUBLISHED" })
    .sort(periodSort)
    .lean<MonthlyAccountLean>();
  return doc ? toAccountDTO(doc) : null;
}

export async function listPublishedPeriods(hostelId: string): Promise<PeriodRef[]> {
  await connectDB();
  const docs = await MonthlyAccount.find({ hostelId, status: "PUBLISHED" }, { month: 1, year: 1 })
    .sort(periodSort)
    .lean<{ _id: Types.ObjectId; month: number; year: number }[]>();
  return docs.map((d) => ({ id: String(d._id), month: d.month, year: d.year }));
}

/* ------------------------------------------------------------------ */
/* Carry-forward                                                       */
/* ------------------------------------------------------------------ */

export interface CarryForwardResult {
  /** The record the members were taken from, or null when none exists. */
  source: (PeriodRef & { status: AccountStatus }) | null;
  members: { memberId: string; name: string }[];
  /** Members of the source record that are now inactive or deleted (not carried). */
  skipped: { memberId: string; name: string }[];
}

/**
 * Finds the most recent accounting record *before* the given period and returns
 * its members, using current registry names. Only member identities are carried
 * forward — never deposits, meals or expenses. Members who have since been
 * deactivated (or removed from the registry) are skipped.
 */
export async function getCarryForwardMembers(
  hostelId: string,
  month: number,
  year: number,
): Promise<CarryForwardResult> {
  const period = parseOrThrow(periodSchema, { month, year });
  await connectDB();

  const previous = await MonthlyAccount.findOne(
    {
      hostelId,
      $or: [{ year: { $lt: period.year } }, { year: period.year, month: { $lt: period.month } }],
    },
    { month: 1, year: 1, status: 1, members: 1 },
  )
    .sort(periodSort)
    .lean<Pick<MonthlyAccountLean, "_id" | "month" | "year" | "status" | "members">>();

  if (!previous) return { source: null, members: [], skipped: [] };

  const ids = previous.members.map((m) => m.memberId);
  const registry = await Member.find({ _id: { $in: ids }, hostelId }, { name: 1, isActive: 1 }).lean<
    { _id: Types.ObjectId; name: string; isActive: boolean }[]
  >();
  const byId = new Map(registry.map((r) => [String(r._id), r]));

  const members: CarryForwardResult["members"] = [];
  const skipped: CarryForwardResult["skipped"] = [];
  for (const m of previous.members) {
    const current = byId.get(String(m.memberId));
    if (current?.isActive) members.push({ memberId: String(m.memberId), name: current.name });
    else skipped.push({ memberId: String(m.memberId), name: current?.name ?? m.name });
  }

  return {
    source: {
      id: String(previous._id),
      month: previous.month,
      year: previous.year,
      status: previous.status,
    },
    members,
    skipped,
  };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

const EMPTY_EXPENSES: Expenses = {
  marketExpense: 0,
  riceExpense: 0,
  fuelExpense: 0,
  otherExtraExpense: 0,
};

/** Creates a DRAFT record for a period with the given members and zero values. */
export async function createMonthlyAccount(
  hostelId: string,
  input: NewMonthInput,
): Promise<MonthlyAccountDTO> {
  const data = parseOrThrow(newMonthSchema, input);
  await connectDB();

  if (await MonthlyAccount.exists({ hostelId, month: data.month, year: data.year })) {
    throw new ServiceError("DUPLICATE_PERIOD", MESSAGES.DUPLICATE_PERIOD);
  }

  // Only members of this hostel can be added.
  const registry = await Member.find({ _id: { $in: data.memberIds }, hostelId }, { name: 1 }).lean<
    { _id: Types.ObjectId; name: string }[]
  >();
  const byId = new Map(registry.map((r) => [String(r._id), r.name]));
  const missing = data.memberIds.filter((id) => !byId.has(id));
  if (missing.length) throw new ServiceError("VALIDATION", MESSAGES.MEMBER_NOT_FOUND);

  const calcInput = {
    members: data.memberIds.map((id) => ({
      memberId: id,
      name: byId.get(id)!,
      investment: 0,
      mealUnits: 0,
    })),
    expenses: EMPTY_EXPENSES,
  };
  const calc = calculateMonthlyAccount(calcInput);

  try {
    const doc = await MonthlyAccount.create({
      hostelId,
      month: data.month,
      year: data.year,
      managerName: data.managerName,
      status: "DRAFT",
      publishedAt: null,
      ...snapshotFields(calc, calcInput.expenses),
    });
    return toAccountDTO(doc.toObject() as MonthlyAccountLean);
  } catch (error) {
    // The unique (hostelId, year, month) index is the final guard against races.
    if (isDuplicateKeyError(error)) {
      throw new ServiceError("DUPLICATE_PERIOD", MESSAGES.DUPLICATE_PERIOD);
    }
    throw error;
  }
}

/**
 * Validates form input, resolves member names and runs the calculator.
 * Names come from this hostel's registry; a member who was removed from the
 * registry keeps the name already saved in this record. Member IDs from other
 * hostels are rejected.
 */
async function prepareSnapshot(
  hostelId: string,
  existing: MonthlyAccountLean,
  rawValues: unknown,
): Promise<{ values: AccountFormValues; calc: CalcResult; expenses: Expenses }> {
  const values = parseOrThrow(accountFormSchema, rawValues);
  const ids = values.members.map((m) => m.memberId);
  const registry = await Member.find({ _id: { $in: ids }, hostelId }, { name: 1 }).lean<
    { _id: Types.ObjectId; name: string }[]
  >();
  const registryNames = new Map(registry.map((r) => [String(r._id), r.name]));
  const savedNames = new Map(existing.members.map((m) => [String(m.memberId), m.name]));

  const resolved: AccountFormValues = {
    ...values,
    members: values.members.map((m) => {
      const name = registryNames.get(m.memberId) ?? savedNames.get(m.memberId);
      if (!name) throw new ServiceError("VALIDATION", MESSAGES.MEMBER_NOT_FOUND);
      return { ...m, name };
    }),
  };

  const { members, expenses } = formToCalcInput(resolved);
  const calc = calculateMonthlyAccount({ members, expenses });
  return { values: resolved, calc, expenses };
}

/** Reasons a record cannot be published yet (empty when publishable). */
function publishProblems(values: AccountFormValues, calc: CalcResult): string[] {
  return [
    ...(values.managerName.trim() ? [] : [MESSAGES.MANAGER_REQUIRED]),
    ...calc.issues.map((i) => i.message),
  ];
}

/**
 * Creates a new month directly from the full entry form (members with deposits
 * and meals, expenses) — as a DRAFT, or PUBLISHED when `publish` is set and the
 * data is publishable. Nothing is written if validation fails.
 */
export async function createAccountWithValues(
  hostelId: string,
  period: { month: number; year: number },
  rawValues: unknown,
  options: { publish?: boolean } = {},
): Promise<MonthlyAccountDTO> {
  const { month, year } = parseOrThrow(periodSchema, period);
  await connectDB();
  if (await MonthlyAccount.exists({ hostelId, month, year })) {
    throw new ServiceError("DUPLICATE_PERIOD", MESSAGES.DUPLICATE_PERIOD);
  }

  const noSavedMembers = { members: [] } as unknown as MonthlyAccountLean;
  const { values, calc, expenses } = await prepareSnapshot(hostelId, noSavedMembers, rawValues);
  if (options.publish) {
    const problems = publishProblems(values, calc);
    if (problems.length) throw new ServiceError("NOT_PUBLISHABLE", problems[0], problems);
  }

  try {
    const doc = await MonthlyAccount.create({
      hostelId,
      month,
      year,
      managerName: values.managerName,
      status: options.publish ? "PUBLISHED" : "DRAFT",
      publishedAt: options.publish ? new Date() : null,
      ...snapshotFields(calc, expenses),
    });
    return toAccountDTO(doc.toObject() as MonthlyAccountLean);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ServiceError("DUPLICATE_PERIOD", MESSAGES.DUPLICATE_PERIOD);
    }
    throw error;
  }
}

async function loadAccount(hostelId: string, id: string): Promise<MonthlyAccountLean> {
  assertObjectId(id);
  await connectDB();
  const doc = await MonthlyAccount.findOne({ _id: id, hostelId }).lean<MonthlyAccountLean>();
  if (!doc) throw new ServiceError("NOT_FOUND", MESSAGES.ACCOUNT_NOT_FOUND);
  return doc;
}

export interface SaveResult {
  account: MonthlyAccountDTO;
  issues: CalcIssue[];
}

/**
 * Saves a draft. Drafts may be incomplete (e.g. zero meals); issues are
 * returned so the UI can show them. Published records are never overwritten:
 * the update is conditional on status === "DRAFT" at the database level.
 */
export async function saveDraft(
  hostelId: string,
  id: string,
  rawValues: unknown,
): Promise<SaveResult> {
  const existing = await loadAccount(hostelId, id);
  if (existing.status === "PUBLISHED") {
    throw new ServiceError("PUBLISHED_LOCKED", MESSAGES.PUBLISHED_LOCKED);
  }
  const { values, calc, expenses } = await prepareSnapshot(hostelId, existing, rawValues);

  const doc = await MonthlyAccount.findOneAndUpdate(
    { _id: existing._id, hostelId, status: "DRAFT" },
    { $set: { managerName: values.managerName, ...snapshotFields(calc, expenses) } },
    { returnDocument: "after", runValidators: true },
  ).lean<MonthlyAccountLean>();
  if (!doc) throw new ServiceError("PUBLISHED_LOCKED", MESSAGES.PUBLISHED_LOCKED);

  return { account: toAccountDTO(doc), issues: calc.issues };
}

/**
 * Saves the submitted values and publishes the record in one conditional
 * update. Publishing requires a manager name and a fully valid calculation
 * (at least one member, total meals > 0, reconciled totals).
 */
export async function publishAccount(
  hostelId: string,
  id: string,
  rawValues: unknown,
): Promise<MonthlyAccountDTO> {
  const existing = await loadAccount(hostelId, id);
  if (existing.status === "PUBLISHED") {
    throw new ServiceError("PUBLISHED_LOCKED", MESSAGES.PUBLISHED_LOCKED);
  }
  const { values, calc, expenses } = await prepareSnapshot(hostelId, existing, rawValues);

  const problems = publishProblems(values, calc);
  if (problems.length) throw new ServiceError("NOT_PUBLISHABLE", problems[0], problems);

  const doc = await MonthlyAccount.findOneAndUpdate(
    { _id: existing._id, hostelId, status: "DRAFT" },
    {
      $set: {
        managerName: values.managerName,
        ...snapshotFields(calc, expenses),
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    },
    { returnDocument: "after", runValidators: true },
  ).lean<MonthlyAccountLean>();
  if (!doc) throw new ServiceError("PUBLISHED_LOCKED", MESSAGES.PUBLISHED_LOCKED);
  return toAccountDTO(doc);
}

/** Moves a published record back to DRAFT so it can be edited (explicit action). */
export async function unpublishAccount(hostelId: string, id: string): Promise<MonthlyAccountDTO> {
  assertObjectId(id);
  await connectDB();
  const doc = await MonthlyAccount.findOneAndUpdate(
    { _id: id, hostelId, status: "PUBLISHED" },
    { $set: { status: "DRAFT", publishedAt: null } },
    { returnDocument: "after" },
  ).lean<MonthlyAccountLean>();
  if (!doc) throw new ServiceError("NOT_FOUND", MESSAGES.ACCOUNT_NOT_FOUND);
  return toAccountDTO(doc);
}

/** Deletes a draft. Published records are refused (use deleteAccount with allowPublished). */
export async function deleteDraftAccount(hostelId: string, id: string): Promise<void> {
  return deleteAccount(hostelId, id);
}

/**
 * Permanently deletes a monthly record of this hostel. Published records are
 * only deleted when `allowPublished` is set — the admin UI does this after an
 * explicit confirmation — so nothing public disappears by accident.
 */
export async function deleteAccount(
  hostelId: string,
  id: string,
  options: { allowPublished?: boolean } = {},
): Promise<void> {
  assertObjectId(id);
  await connectDB();
  const filter: Record<string, unknown> = { _id: id, hostelId };
  if (!options.allowPublished) filter.status = "DRAFT";
  const res = await MonthlyAccount.deleteOne(filter);
  if (res.deletedCount === 0) {
    const exists = await MonthlyAccount.exists({ _id: id, hostelId });
    throw exists
      ? new ServiceError("PUBLISHED_LOCKED", MESSAGES.PUBLISHED_LOCKED)
      : new ServiceError("NOT_FOUND", MESSAGES.ACCOUNT_NOT_FOUND);
  }
}
