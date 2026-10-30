import { beforeEach, describe, expect, it } from "vitest";
import { calculateMonthlyAccount } from "@/features/accounting/calculate";
import {
  accountToCalcInput,
  createAccountWithValues,
  createMonthlyAccount,
  deleteAccount,
  deleteDraftAccount,
  getAccountById,
  getCarryForwardMembers,
  listAccounts,
  publishAccount,
  saveDraft,
  unpublishAccount,
} from "@/services/accounting-service";
import { ServiceError } from "@/services/errors";
import type { HostelDTO } from "@/services/hostel-service";
import { createMember, listMembers, updateMember } from "@/services/member-service";
import { getPublicReport } from "@/services/public-report-service";
import type { MonthlyAccountDTO } from "@/types/accounting";
import { makeHostel, setupTestDatabase } from "./helpers/db";

setupTestDatabase();

let hostel: HostelDTO;
let H: string;
beforeEach(async () => {
  hostel = await makeHostel();
  H = hostel.id;
});

async function makeMembers(...names: string[]) {
  return Promise.all(names.map((name) => createMember(H, { name })));
}

function formFor(
  account: MonthlyAccountDTO,
  rows: Record<string, { investment: string; mealCount: string }>,
  expenses = { marketExpense: "2000", riceExpense: "490", fuelExpense: "150", otherExtraExpense: "50" },
  managerName = "রহিম উদ্দিন",
) {
  return {
    managerName,
    members: account.members.map((m) => ({
      memberId: m.memberId,
      name: m.name,
      investment: rows[m.name]?.investment ?? "0",
      mealCount: rows[m.name]?.mealCount ?? "0",
    })),
    expenses,
  };
}

async function expectServiceError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(ServiceError);
  await expect(promise).rejects.toMatchObject({ code });
}

/** Creates a fully valid, published month. */
async function publishedMonth(month: number, year: number, memberIds: string[], hostelId = H) {
  const account = await createMonthlyAccount(hostelId, { month, year, managerName: "ম্যানেজার", memberIds });
  const rows = Object.fromEntries(
    account.members.map((m) => [m.name, { investment: "1000", mealCount: "10" }]),
  );
  return publishAccount(hostelId, account.id, formFor(account, rows));
}

describe("creating months and carry-forward", () => {
  it("creates a new month when no previous record exists", async () => {
    const [a, b] = await makeMembers("রহিম", "করিম");
    const carry = await getCarryForwardMembers(H, 10, 2026);
    expect(carry.source).toBeNull();
    expect(carry.members).toEqual([]);

    const account = await createMonthlyAccount(H, {
      month: 10,
      year: 2026,
      managerName: "",
      memberIds: [a.id, b.id],
    });
    expect(account.status).toBe("DRAFT");
    expect(account.members.map((m) => m.name)).toEqual(["রহিম", "করিম"]);
    expect(account.members.every((m) => m.investment === 0 && m.mealCount === 0)).toBe(true);
  });

  it("carries members forward from the previous month without financial data", async () => {
    const [a, b, c] = await makeMembers("রহিম", "করিম", "জামাল");
    await publishedMonth(9, 2026, [a.id, b.id, c.id]);

    const carry = await getCarryForwardMembers(H, 10, 2026);
    expect(carry.source).toMatchObject({ month: 9, year: 2026, status: "PUBLISHED" });
    expect(carry.members.map((m) => m.memberId)).toEqual([a.id, b.id, c.id]);

    const october = await createMonthlyAccount(H, {
      month: 10,
      year: 2026,
      managerName: "",
      memberIds: carry.members.map((m) => m.memberId),
    });
    expect(october.members).toHaveLength(3);
    expect(october.members.every((m) => m.investment === 0 && m.mealCount === 0)).toBe(true);
    expect(october.expenses).toEqual({
      marketExpense: 0,
      riceExpense: 0,
      fuelExpense: 0,
      otherExtraExpense: 0,
    });
  });

  it("uses the most recent earlier record across year boundaries and skips inactive members", async () => {
    const [a, b] = await makeMembers("A", "B");
    await publishedMonth(11, 2025, [a.id]);
    await publishedMonth(12, 2025, [a.id, b.id]);
    await updateMember(H, { id: b.id, isActive: false });

    const carry = await getCarryForwardMembers(H, 1, 2026);
    expect(carry.source).toMatchObject({ month: 12, year: 2025 });
    expect(carry.members.map((m) => m.memberId)).toEqual([a.id]);
    expect(carry.skipped.map((m) => m.memberId)).toEqual([b.id]);
  });

  it("prevents duplicate records for the same month and year", async () => {
    const [a] = await makeMembers("A");
    await createMonthlyAccount(H, { month: 10, year: 2026, managerName: "", memberIds: [a.id] });
    await expectServiceError(
      createMonthlyAccount(H, { month: 10, year: 2026, managerName: "", memberIds: [a.id] }),
      "DUPLICATE_PERIOD",
    );
  });

  it("rejects duplicate members in one record", async () => {
    const [a] = await makeMembers("A");
    await expectServiceError(
      createMonthlyAccount(H, { month: 10, year: 2026, managerName: "", memberIds: [a.id, a.id] }),
      "VALIDATION",
    );
  });
});

describe("creating a month from the full entry form", () => {
  const values = (rows: { memberId: string; investment: string; mealCount: string }[], managerName = "রহিম") => ({
    managerName,
    members: rows.map((r) => ({ ...r, name: "" })),
    expenses: { marketExpense: "2000", riceExpense: "490", fuelExpense: "150", otherExtraExpense: "50" },
  });

  it("saves a draft with all entered data in one step", async () => {
    const [a, b] = await makeMembers("রহিম", "করিম");
    const created = await createAccountWithValues(
      H,
      { month: 10, year: 2026 },
      values([
        { memberId: a.id, investment: "5000", mealCount: "45" },
        { memberId: b.id, investment: "1000", mealCount: "38" },
      ]),
    );
    expect(created.status).toBe("DRAFT");
    expect(created.members.map((m) => m.name)).toEqual(["রহিম", "করিম"]);
    expect(created.mealRate).toBe(3000);
    expect(created.members.map((m) => m.refundAmount)).toEqual([355000, 0]);
    expect(created.members.map((m) => m.outstandingBalance)).toEqual([0, 24000]);
  });

  it("publishes directly when valid, and writes nothing when not publishable", async () => {
    const [a] = await makeMembers("A");
    await expectServiceError(
      createAccountWithValues(H, { month: 9, year: 2026 }, values([{ memberId: a.id, investment: "1", mealCount: "0" }]), {
        publish: true,
      }),
      "NOT_PUBLISHABLE",
    );
    expect(await listAccounts(H)).toHaveLength(0);

    const published = await createAccountWithValues(
      H,
      { month: 9, year: 2026 },
      values([{ memberId: a.id, investment: "1", mealCount: "10" }]),
      { publish: true },
    );
    expect(published.status).toBe("PUBLISHED");
    expect((await getPublicReport(hostel.code)).report?.id).toBe(published.id);
  });

  it("refuses duplicates and members of other hostels", async () => {
    const [a] = await makeMembers("A");
    const other = await makeHostel("অন্য");
    const foreign = await createMember(other.id, { name: "অন্যের" });
    const row = [{ memberId: a.id, investment: "0", mealCount: "1" }];
    await createAccountWithValues(H, { month: 10, year: 2026 }, values(row));
    await expectServiceError(createAccountWithValues(H, { month: 10, year: 2026 }, values(row)), "DUPLICATE_PERIOD");
    await expectServiceError(
      createAccountWithValues(H, { month: 11, year: 2026 }, values([{ memberId: foreign.id, investment: "0", mealCount: "1" }])),
      "VALIDATION",
    );
  });
});

describe("editing a monthly record", () => {
  it("adds and removes members in a draft", async () => {
    const [a, b, c] = await makeMembers("A", "B", "C");
    const account = await createMonthlyAccount(H, {
      month: 10,
      year: 2026,
      managerName: "",
      memberIds: [a.id, b.id],
    });

    const form = formFor(account, { A: { investment: "500", mealCount: "10" } });
    // remove B, add C
    form.members = [form.members[0], { memberId: c.id, name: "", investment: "0", mealCount: "5" }];
    const { account: saved } = await saveDraft(H, account.id, form);

    expect(saved.members.map((m) => m.memberId)).toEqual([a.id, c.id]);
    expect(saved.members[1].name).toBe("C");
    expect(saved.totalMembers).toBe(2);
    // B is still in the registry; only removed from this month.
    expect((await listMembers(H)).map((m) => m.id)).toContain(b.id);
    const carry = await getCarryForwardMembers(H, 11, 2026);
    expect(carry.members.map((m) => m.memberId)).toEqual([a.id, c.id]);
  });

  it("rejects negative values and duplicate members on save", async () => {
    const [a] = await makeMembers("A");
    const account = await createMonthlyAccount(H, { month: 10, year: 2026, managerName: "", memberIds: [a.id] });
    await expectServiceError(
      saveDraft(H, account.id, formFor(account, { A: { investment: "-1", mealCount: "1" } })),
      "VALIDATION",
    );
    const dup = formFor(account, { A: { investment: "1", mealCount: "1" } });
    dup.members.push(dup.members[0]);
    await expectServiceError(saveDraft(H, account.id, dup), "VALIDATION");
  });

  it("saves drafts with zero meals but refuses to publish them", async () => {
    const [a] = await makeMembers("A");
    const account = await createMonthlyAccount(H, { month: 10, year: 2026, managerName: "", memberIds: [a.id] });
    const form = formFor(account, {});
    const { issues } = await saveDraft(H, account.id, form);
    expect(issues.map((i) => i.code)).toContain("ZERO_MEALS");
    await expectServiceError(publishAccount(H, account.id, form), "NOT_PUBLISHABLE");
  });

  it("requires a manager name before publishing", async () => {
    const [a] = await makeMembers("A");
    const account = await createMonthlyAccount(H, { month: 10, year: 2026, managerName: "", memberIds: [a.id] });
    const form = formFor(account, { A: { investment: "1", mealCount: "1" } }, undefined, "  ");
    await expectServiceError(publishAccount(H, account.id, form), "NOT_PUBLISHABLE");
  });

  it("keeps financial totals consistent after saving and reloading", async () => {
    const [a, b, c] = await makeMembers("A", "B", "C");
    const account = await createMonthlyAccount(H, {
      month: 10,
      year: 2026,
      managerName: "",
      memberIds: [a.id, b.id, c.id],
    });
    const form = formFor(
      account,
      {
        A: { investment: "1500.50", mealCount: "31.5" },
        B: { investment: "0", mealCount: "29" },
        C: { investment: "3000", mealCount: "17.25" },
      },
      { marketExpense: "4321.09", riceExpense: "987.65", fuelExpense: "333.33", otherExtraExpense: "100" },
    );
    await saveDraft(H, account.id, form);
    const reloaded = (await getAccountById(H, account.id))!;

    // Recalculating from the stored inputs gives exactly the stored snapshot.
    const recalculated = calculateMonthlyAccount(accountToCalcInput(reloaded));
    expect(recalculated.isValid).toBe(true);
    expect(reloaded.members.map((m) => m.totalCost)).toEqual(
      recalculated.members.map((m) => m.totalCost),
    );
    expect(reloaded.mealRate).toBe(recalculated.summary.mealRate);
    expect(reloaded.totalMeals).toBe(77.75);
    expect(reloaded.totalMemberCost).toBe(432109 + 98765 + 33333 + 10000);
    expect(reloaded.members.reduce((s, m) => s + m.totalCost, 0)).toBe(reloaded.totalMemberCost);
    expect(reloaded.members.reduce((s, m) => s + m.extraCost, 0)).toBe(reloaded.totalExtraCost);
  });
});

describe("publishing workflow", () => {
  it("does not let a published record be silently overwritten", async () => {
    const [a] = await makeMembers("A");
    const published = await publishedMonth(10, 2026, [a.id]);
    const form = formFor(published, { A: { investment: "9999", mealCount: "99" } });

    await expectServiceError(saveDraft(H, published.id, form), "PUBLISHED_LOCKED");
    await expectServiceError(publishAccount(H, published.id, form), "PUBLISHED_LOCKED");
    await expectServiceError(deleteDraftAccount(H, published.id), "PUBLISHED_LOCKED");
    expect((await getAccountById(H, published.id))!.members[0].investment).toBe(100000);

    // Explicit unpublish makes it editable again.
    await unpublishAccount(H, published.id);
    const { account } = await saveDraft(H, published.id, form);
    expect(account.members[0].investment).toBe(999900);
    expect(account.status).toBe("DRAFT");
  });

  it("deletes a published record only when explicitly allowed", async () => {
    const [a] = await makeMembers("A");
    const published = await publishedMonth(10, 2026, [a.id]);
    await expectServiceError(deleteAccount(H, published.id), "PUBLISHED_LOCKED");
    await deleteAccount(H, published.id, { allowPublished: true });
    expect(await getAccountById(H, published.id)).toBeNull();
    expect((await getPublicReport(hostel.code)).report).toBeNull();
    // Members stay in the registry.
    expect((await listMembers(H)).map((m) => m.id)).toEqual([a.id]);
  });

  it("keeps historical reports unchanged when a member is renamed", async () => {
    const [a] = await makeMembers("পুরনো নাম");
    const september = await publishedMonth(9, 2026, [a.id]);
    await updateMember(H, { id: a.id, name: "নতুন নাম" });
    await updateMember(H, { id: a.id, isActive: false });

    const reloaded = (await getAccountById(H, september.id))!;
    expect(reloaded.members[0].name).toBe("পুরনো নাম");
    expect(reloaded).toEqual(september);
  });
});

describe("public report", () => {
  it("never shows unpublished drafts", async () => {
    const [a] = await makeMembers("A");
    await createMonthlyAccount(H, { month: 10, year: 2026, managerName: "", memberIds: [a.id] });

    const latest = await getPublicReport(hostel.code);
    expect(latest.hostel).toMatchObject({ code: hostel.code, name: hostel.name });
    expect(latest.report).toBeNull();
    expect(latest.periods).toEqual([]);
    expect((await getPublicReport(hostel.code, "2026-10")).report).toBeNull();
  });

  it("shows the latest published period by default, not the latest document", async () => {
    const [a] = await makeMembers("A");
    await publishedMonth(10, 2026, [a.id]);
    // Created later, but an older period:
    await publishedMonth(8, 2026, [a.id]);
    // Newer period, but only a draft:
    await createMonthlyAccount(H, { month: 11, year: 2026, managerName: "", memberIds: [a.id] });

    const { report, periods } = await getPublicReport(hostel.code);
    expect(report).toMatchObject({ month: 10, year: 2026, status: "PUBLISHED" });
    expect(periods.map((p) => [p.month, p.year])).toEqual([
      [10, 2026],
      [8, 2026],
    ]);

    const older = await getPublicReport(hostel.code, "2026-08");
    expect(older.report).toMatchObject({ month: 8, year: 2026 });
    expect((await getPublicReport(hostel.code, "not-a-period")).report).toBeNull();
  });

  it("switches automatically when a newer month is published", async () => {
    const [a] = await makeMembers("A");
    await publishedMonth(9, 2026, [a.id]);
    expect((await getPublicReport(hostel.code)).report).toMatchObject({ month: 9 });
    await publishedMonth(10, 2026, [a.id]);
    expect((await getPublicReport(hostel.code)).report).toMatchObject({ month: 10 });
  });

  it("returns no hostel for an unknown code", async () => {
    const result = await getPublicReport("zzzzzz");
    expect(result).toEqual({ hostel: null, report: null, periods: [] });
  });
});

describe("hostel isolation", () => {
  it("keeps members, records and reports of different hostels apart", async () => {
    const other = await makeHostel("অন্য হোস্টেল");
    const [mine] = await makeMembers("আমার সদস্য");
    const theirs = await createMember(other.id, { name: "অন্যের সদস্য" });

    // Same month can exist once per hostel.
    await publishedMonth(10, 2026, [mine.id]);
    await publishedMonth(10, 2026, [theirs.id], other.id);

    expect((await listMembers(H)).map((m) => m.name)).toEqual(["আমার সদস্য"]);
    expect(await listAccounts(H)).toHaveLength(1);
    expect((await getPublicReport(hostel.code)).report!.members[0].name).toBe("আমার সদস্য");
    expect((await getPublicReport(other.code)).report!.members[0].name).toBe("অন্যের সদস্য");
  });

  it("cannot read or change another hostel's data", async () => {
    const other = await makeHostel("অন্য হোস্টেল");
    const theirs = await createMember(other.id, { name: "অন্যের সদস্য" });
    const theirAccount = await createMonthlyAccount(other.id, {
      month: 10,
      year: 2026,
      managerName: "",
      memberIds: [theirs.id],
    });

    expect(await getAccountById(H, theirAccount.id)).toBeNull();
    await expectServiceError(saveDraft(H, theirAccount.id, formFor(theirAccount, {})), "NOT_FOUND");
    await expectServiceError(deleteDraftAccount(H, theirAccount.id), "NOT_FOUND");
    await expectServiceError(updateMember(H, { id: theirs.id, name: "হ্যাক" }), "NOT_FOUND");
    // Another hostel's member cannot be added to my month.
    await expectServiceError(
      createMonthlyAccount(H, { month: 10, year: 2026, managerName: "", memberIds: [theirs.id] }),
      "VALIDATION",
    );
    expect((await getAccountById(other.id, theirAccount.id))!.status).toBe("DRAFT");
  });
});
