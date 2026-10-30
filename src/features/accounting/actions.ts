"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/authz";
import { periodSchema, type NewMonthInput } from "@/schemas/accounting";
import {
  createMonthlyAccount,
  deleteAccount,
  getAccountByPeriod,
  getCarryForwardMembers,
  publishAccount,
  saveDraft,
  unpublishAccount,
  type CarryForwardResult,
  type SaveResult,
} from "@/services/accounting-service";
import { parseOrThrow } from "@/services/validation";
import type { MonthlyAccountDTO } from "@/types/accounting";

// Every action resolves the caller's hostel on the server and passes it to the
// service; a client can never choose which hostel it operates on.

function revalidateAccounting() {
  revalidatePath("/admin", "layout");
  revalidatePath("/monthly-bill", "layout");
}

export interface PrepareNewMonthResult {
  existingId: string | null;
  carryForward: CarryForwardResult;
}

/** Looks up the carry-forward member list for a period (and whether it already exists). */
export async function prepareNewMonthAction(
  month: number,
  year: number,
): Promise<ActionResult<PrepareNewMonthResult>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const period = parseOrThrow(periodSchema, { month, year });
    const existing = await getAccountByPeriod(hostel.id, period.month, period.year);
    const carryForward = await getCarryForwardMembers(hostel.id, period.month, period.year);
    return { existingId: existing?.id ?? null, carryForward };
  });
}

export async function createMonthlyAccountAction(
  input: NewMonthInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const account = await createMonthlyAccount(hostel.id, input);
    revalidateAccounting();
    return { id: account.id };
  });
}

export async function saveDraftAction(id: string, values: unknown): Promise<ActionResult<SaveResult>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const result = await saveDraft(hostel.id, id, values);
    revalidateAccounting();
    return result;
  });
}

export async function publishAccountAction(
  id: string,
  values: unknown,
): Promise<ActionResult<MonthlyAccountDTO>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const account = await publishAccount(hostel.id, id, values);
    revalidateAccounting();
    return account;
  });
}

export async function unpublishAccountAction(id: string): Promise<ActionResult<MonthlyAccountDTO>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const account = await unpublishAccount(hostel.id, id);
    revalidateAccounting();
    return account;
  });
}

/** Permanently deletes a record (draft or published); the UI confirms first. */
export async function deleteAccountAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    await deleteAccount(hostel.id, id, { allowPublished: true });
    revalidateAccounting();
    return undefined;
  });
}
