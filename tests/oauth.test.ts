import { describe, expect, it } from "vitest";
import { setupTestDatabase } from "./helpers/db";
import { Admin } from "@/models/Admin";
import { Hostel } from "@/models/Hostel";
import {
  findOrCreateOAuthUser,
  getUserContext,
  registerUser,
  verifyAdminCredentials,
} from "@/services/admin-service";

setupTestDatabase();

describe("OAuth (Google) sign-in", () => {
  it("creates a password-less user with a hostel on first sign-in, and reuses it after", async () => {
    const first = await findOrCreateOAuthUser("New.User@Gmail.com", "নতুন", "আমার হোস্টেল");
    expect(first.email).toBe("new.user@gmail.com");

    const ctx = await getUserContext(first.id);
    expect(ctx?.hostel.name).toBe("আমার হোস্টেল");

    const again = await findOrCreateOAuthUser("new.user@gmail.com", "Other");
    expect(again.id).toBe(first.id);
    expect(await Admin.countDocuments()).toBe(1);
    expect(await Hostel.countDocuments()).toBe(1);

    // No password: password login must fail, even with an empty password.
    expect(await verifyAdminCredentials("new.user@gmail.com", "")).toBeNull();
    expect(await verifyAdminCredentials("new.user@gmail.com", "anything")).toBeNull();
  });

  it("signs in to an existing password account with the same email", async () => {
    const ctx = await registerUser({
      name: "পুরনো",
      email: "old@example.com",
      hostelName: "পুরনো হোস্টেল",
      password: "password123",
      confirmPassword: "password123",
    });
    const user = await findOrCreateOAuthUser("old@example.com", "Google Name");
    expect(user.id).toBe(ctx.userId);
    expect(await Hostel.countDocuments()).toBe(1);
    expect(await verifyAdminCredentials("old@example.com", "password123")).not.toBeNull();
  });
});
