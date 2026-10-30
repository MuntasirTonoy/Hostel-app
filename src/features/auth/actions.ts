"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { signIn, signOut } from "@/lib/auth";
import { requireAdmin } from "@/lib/authz";
import { loginSchema } from "@/schemas/auth";
import {
  changeAdminPassword,
  isEmailAvailable,
  registerUser,
  updateProfile,
  type ProfileDTO,
} from "@/services/admin-service";
import { updateHostel, type HostelDTO } from "@/services/hostel-service";

export interface FormState {
  error?: string;
}
export type LoginState = FormState;

async function signInAndRedirect(email: string, password: string): Promise<FormState> {
  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "ইমেইল বা পাসওয়ার্ড সঠিক নয়।"
            : "লগইন করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
      };
    }
    // signIn throws a redirect on success; let Next.js handle it.
    throw error;
  }
  return {};
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  return signInAndRedirect(parsed.data.email, parsed.data.password);
}

/** Public sign-up: creates the user and their hostel, then signs them in. */
export async function registerAction(values: unknown): Promise<FormState> {
  const result = await runAction(() => registerUser(values));
  if (!result.ok) return { error: result.error };
  const { email } = result.data;
  const password = (values as { password: string }).password;
  return signInAndRedirect(email, password);
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function changePasswordAction(values: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdmin();
    await changeAdminPassword(admin.email, values);
    return undefined;
  });
}

export async function updateHostelAction(values: unknown): Promise<ActionResult<HostelDTO>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const updated = await updateHostel(hostel.id, values);
    revalidatePath("/", "layout");
    return updated;
  });
}


export async function updateProfileAction(values: unknown): Promise<ActionResult<ProfileDTO>> {
  return runAction(async () => {
    const { userId } = await requireAdmin();
    const profile = await updateProfile(userId, values);
    revalidatePath("/admin", "layout");
    return profile;
  });
}

/** Live check used by the profile form before asking for the password. */
export async function checkEmailAvailableAction(
  email: string,
): Promise<ActionResult<{ available: boolean }>> {
  return runAction(async () => {
    const { userId } = await requireAdmin();
    return { available: await isEmailAvailable(userId, email) };
  });
}
