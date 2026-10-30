import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupTestDatabase } from "./helpers/db";

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: authMock, signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  createMonthlyAccountAction,
  deleteAccountAction,
  prepareNewMonthAction,
  publishAccountAction,
  saveDraftAction,
  unpublishAccountAction,
} from "@/features/accounting/actions";
import { createMemberAction, deleteMemberAction, updateMemberAction } from "@/features/members/actions";
import { Admin } from "@/models/Admin";
import { Member } from "@/models/Member";
import { MonthlyAccount } from "@/models/MonthlyAccount";
import { createMonthlyAccount } from "@/services/accounting-service";
import { registerUser, updateProfile, verifyAdminCredentials } from "@/services/admin-service";
import { createMember, listMembers } from "@/services/member-service";

setupTestDatabase();

const signedInAs = (userId: string | null) =>
  authMock.mockResolvedValue(userId ? { user: { id: userId }, expires: "2999-01-01" } : null);

const register = (email: string, hostelName = "হোস্টেল") =>
  registerUser({ name: "ব্যবহারকারী", email, hostelName, password: "password123", confirmPassword: "password123" });

beforeEach(() => authMock.mockReset());

describe("sign-up", () => {
  it("creates a user with their own hostel and a short code", async () => {
    const user = await register("New@Example.com", "শাপলা ছাত্রাবাস");
    expect(user.email).toBe("new@example.com");
    expect(user.hostel.name).toBe("শাপলা ছাত্রাবাস");
    expect(user.hostel.code).toMatch(/^[a-z2-9]{6}$/);
    expect(await verifyAdminCredentials("new@example.com", "password123")).toMatchObject({ id: user.userId });
    expect(await verifyAdminCredentials("new@example.com", "wrong-password")).toBeNull();
  });

  it("rejects a duplicate email and invalid input", async () => {
    await register("a@example.com");
    await expect(register("A@example.com")).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      registerUser({ name: "x", email: "bad", hostelName: "", password: "short", confirmPassword: "nope" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await Admin.countDocuments()).toBe(1);
  });
});

describe("profile", () => {
  it("updates the name freely but needs the current password to change email", async () => {
    const user = await register("me@example.com");
    const renamed = await updateProfile(user.userId, { name: "নতুন নাম", email: "me@example.com" });
    expect(renamed).toMatchObject({ name: "নতুন নাম", email: "me@example.com" });

    await expect(
      updateProfile(user.userId, { name: "নতুন নাম", email: "new@example.com" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      updateProfile(user.userId, { name: "x", email: "new@example.com", currentPassword: "wrong-pass" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    const moved = await updateProfile(user.userId, {
      name: "নতুন নাম",
      email: "New@Example.com",
      currentPassword: "password123",
    });
    expect(moved.email).toBe("new@example.com");
    expect(await verifyAdminCredentials("new@example.com", "password123")).not.toBeNull();
  });

  it("refuses an email that belongs to another account", async () => {
    const a = await register("a@example.com");
    await register("b@example.com");
    await expect(
      updateProfile(a.userId, { name: "A", email: "b@example.com", currentPassword: "password123" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("server action authorization", () => {
  it("rejects anonymous visitors and deleted accounts for every action", async () => {
    const owner = await register("owner@example.com");
    const member = await createMember(owner.hostel.id, { name: "A" });
    const account = await createMonthlyAccount(owner.hostel.id, {
      month: 10,
      year: 2026,
      managerName: "",
      memberIds: [member.id],
    });
    const form = {
      managerName: "X",
      members: [{ memberId: member.id, name: "A", investment: "100", mealCount: "1" }],
      expenses: { marketExpense: "10", riceExpense: "0", fuelExpense: "0", otherExtraExpense: "0" },
    };

    // Anonymous, a non-existent user id, and a malformed id.
    for (const id of [null, "64b000000000000000000000", "not-an-id"]) {
      signedInAs(id);
      const results = await Promise.all([
        prepareNewMonthAction(11, 2026),
        createMonthlyAccountAction({ month: 11, year: 2026, managerName: "", memberIds: [member.id] }),
        saveDraftAction(account.id, form),
        publishAccountAction(account.id, form),
        unpublishAccountAction(account.id),
        deleteAccountAction(account.id),
        createMemberAction({ name: "Hacker" }),
        updateMemberAction({ id: member.id, name: "Hacked" }),
        deleteMemberAction(member.id),
      ]);
      for (const result of results) {
        expect(result).toMatchObject({ ok: false, code: "UNAUTHORIZED" });
      }
    }

    expect(await MonthlyAccount.countDocuments()).toBe(1);
    const stored = await MonthlyAccount.findById(account.id).lean();
    expect(stored?.status).toBe("DRAFT");
    expect(stored?.members[0].investment).toBe(0);
    expect((await Member.find().lean()).map((m) => m.name)).toEqual(["A"]);
  });

  it("scopes a signed-in user's actions to their own hostel", async () => {
    const alice = await register("alice@example.com", "Alice Hostel");
    const bob = await register("bob@example.com", "Bob Hostel");
    const bobsMember = await createMember(bob.hostel.id, { name: "Bob's member" });
    const bobsAccount = await createMonthlyAccount(bob.hostel.id, {
      month: 10,
      year: 2026,
      managerName: "",
      memberIds: [bobsMember.id],
    });

    signedInAs(alice.userId);
    const created = await createMemberAction({ name: "Alice's member" });
    expect(created.ok).toBe(true);
    expect((await listMembers(alice.hostel.id)).map((m) => m.name)).toEqual(["Alice's member"]);
    expect((await listMembers(bob.hostel.id)).map((m) => m.name)).toEqual(["Bob's member"]);

    // Alice can create her own October even though Bob has one.
    if (!created.ok) return;
    const month = await createMonthlyAccountAction({
      month: 10,
      year: 2026,
      managerName: "Alice",
      memberIds: [created.data.id],
    });
    expect(month.ok).toBe(true);

    // ...but cannot touch Bob's record or member.
    expect(await deleteAccountAction(bobsAccount.id)).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(await updateMemberAction({ id: bobsMember.id, name: "Hacked" })).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
    });
    expect(await MonthlyAccount.exists({ _id: bobsAccount.id })).toBeTruthy();
  });

  it("revokes access when the account is deleted", async () => {
    const user = await register("gone@example.com");
    signedInAs(user.userId);
    expect((await createMemberAction({ name: "A" })).ok).toBe(true);
    await Admin.deleteOne({ _id: user.userId });
    expect(await createMemberAction({ name: "B" })).toMatchObject({ ok: false, code: "UNAUTHORIZED" });
  });
});
