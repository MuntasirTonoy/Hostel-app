import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeHostel, setupTestDatabase } from "./helpers/db";

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: authMock, signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

import { checkHostelIdAvailableAction, updateHostelIdAction } from "@/features/auth/actions";
import { MESSAGES } from "@/services/errors";
import {
  getHostelByCode,
  isHostelIdAvailable,
  updateHostelId,
} from "@/services/hostel-service";
import { registerUser } from "@/services/admin-service";
import { getPublicReport } from "@/services/public-report-service";

setupTestDatabase();

beforeEach(() => authMock.mockReset());

describe("Hostel ID", () => {
  it("checks availability against other hostels only", async () => {
    const a = await makeHostel("A");
    const b = await makeHostel("B");
    expect(await isHostelIdAvailable(a.id, b.code)).toBe(false);
    expect(await isHostelIdAvailable(a.id, b.code.toUpperCase())).toBe(false); // case-insensitive
    expect(await isHostelIdAvailable(a.id, a.code)).toBe(true); // its own ID
    expect(await isHostelIdAvailable(a.id, "shapla-hostel")).toBe(true);
    // Malformed IDs are never "available".
    for (const bad of ["ab", "-abc", "abc-", "a--b", "has space", "বাংলা", "x".repeat(31)]) {
      expect(await isHostelIdAvailable(a.id, bad)).toBe(false);
    }
  });

  it("changes the ID, moves the public link and frees the old one", async () => {
    const a = await makeHostel("A");
    const oldId = a.code;
    const updated = await updateHostelId(a.id, { code: "  Shapla-Hostel " });
    expect(updated.code).toBe("shapla-hostel");

    expect((await getHostelByCode("shapla-hostel"))?.id).toBe(a.id);
    expect(await getHostelByCode(oldId)).toBeNull();
    expect((await getPublicReport("shapla-hostel")).hostel).toEqual({ code: "shapla-hostel", name: "A" });
    expect((await getPublicReport(oldId)).hostel).toBeNull();

    // The old ID can now be taken by another hostel.
    const b = await makeHostel("B");
    expect(await isHostelIdAvailable(b.id, oldId)).toBe(true);
  });

  it("rejects an ID that is taken or malformed", async () => {
    const a = await makeHostel("A");
    const b = await makeHostel("B");
    await expect(updateHostelId(a.id, { code: b.code })).rejects.toMatchObject({
      code: "VALIDATION",
      message: MESSAGES.HOSTEL_ID_TAKEN,
    });
    await expect(updateHostelId(a.id, { code: "a b" })).rejects.toMatchObject({ code: "VALIDATION" });
    expect((await getHostelByCode(a.code))?.id).toBe(a.id); // unchanged
  });

  it("actions use the signed-in user's hostel and require login", async () => {
    const user = await registerUser({
      name: "U",
      email: "u@example.com",
      hostelName: "H",
      password: "password123",
      confirmPassword: "password123",
    });
    const other = await makeHostel("Other");

    authMock.mockResolvedValue(null);
    expect(await checkHostelIdAvailableAction("free-id")).toMatchObject({ ok: false, code: "UNAUTHORIZED" });
    expect(await updateHostelIdAction({ code: "free-id" })).toMatchObject({ ok: false, code: "UNAUTHORIZED" });

    authMock.mockResolvedValue({ user: { id: user.userId }, expires: "2999-01-01" });
    expect(await checkHostelIdAvailableAction(other.code)).toEqual({ ok: true, data: { available: false } });
    expect(await checkHostelIdAvailableAction("free-id")).toEqual({ ok: true, data: { available: true } });
    expect(await updateHostelIdAction({ code: other.code })).toMatchObject({ ok: false, code: "VALIDATION" });
    expect(await updateHostelIdAction({ code: "free-id" })).toMatchObject({ ok: true, data: { code: "free-id" } });
    expect((await getHostelByCode("free-id"))?.id).toBe(user.hostel.id);
  });
});
