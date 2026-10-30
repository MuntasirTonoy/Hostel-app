import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getUserContext, type UserContext } from "@/services/admin-service";
import { MESSAGES, ServiceError } from "@/services/errors";
import { auth } from "./auth";

export type AdminSession = UserContext;

/**
 * Returns the signed-in user with their hostel, or null. The user and hostel are
 * re-loaded from the database (once per request), so deleted accounts lose
 * access immediately and every query can be scoped to `hostel.id`.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return getUserContext(userId);
});

/** Guard for every Server Action that reads private data or mutates. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdminSession();
  if (!admin) throw new ServiceError("UNAUTHORIZED", MESSAGES.UNAUTHORIZED);
  return admin;
}

/** Guard for admin pages: redirects to the login page when not signed in. */
export async function requireAdminPage(): Promise<AdminSession> {
  const admin = await getAdminSession();
  if (!admin) redirect("/login");
  return admin;
}
