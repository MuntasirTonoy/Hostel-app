import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Admin } from "@/models/Admin";
import { Hostel } from "@/models/Hostel";
import { changePasswordSchema, registerSchema, updateProfileSchema } from "@/schemas/auth";
import { ServiceError } from "./errors";
import { createHostel, getHostelByOwner, type HostelDTO } from "./hostel-service";
import { parseOrThrow } from "./validation";

const BCRYPT_ROUNDS = 12;
// Used to keep timing similar when the account does not exist.
const DUMMY_HASH = "$2b$12$uP80cgkCd0f2QCad4Jvmrubv/uADCEcB8ARcZrg9dCTt9hlDBTDRC";

type AdminLean = { _id: Types.ObjectId; email: string; name: string; passwordHash: string };

export interface UserContext {
  userId: string;
  email: string;
  name: string;
  hostel: HostelDTO;
}

/** Returns the user when the email exists and the password matches; null otherwise. */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string } | null> {
  await connectDB();
  const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).lean<AdminLean>();
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) return null;
  return { id: String(admin._id), email: admin.email, name: admin.name };
}

/** Loads a signed-in user together with their hostel (null if either no longer exists). */
export async function getUserContext(userId: string): Promise<UserContext | null> {
  if (!Types.ObjectId.isValid(userId)) return null;
  await connectDB();
  const admin = await Admin.findById(userId).lean<AdminLean>();
  if (!admin) return null;
  const hostel = await getHostelByOwner(userId);
  if (!hostel) return null;
  return { userId, email: admin.email, name: admin.name || admin.email, hostel };
}

/** Public sign-up: creates a user and their hostel. */
export async function registerUser(input: unknown): Promise<UserContext> {
  const data = parseOrThrow(registerSchema, input);
  await connectDB();

  if (await Admin.exists({ email: data.email })) {
    throw new ServiceError("VALIDATION", "এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট আছে। লগইন করুন।");
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  let admin;
  try {
    admin = await Admin.create({ email: data.email, name: data.name, passwordHash });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new ServiceError("VALIDATION", "এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট আছে। লগইন করুন।");
    }
    throw error;
  }

  try {
    const hostel = await createHostel(String(admin._id), data.hostelName);
    return { userId: String(admin._id), email: admin.email, name: admin.name, hostel };
  } catch (error) {
    // Do not leave a user without a hostel behind.
    await Admin.deleteOne({ _id: admin._id });
    throw error;
  }
}

/** Creates or resets a user (CLI script). Also makes sure they own a hostel. */
export async function upsertAdmin(
  email: string,
  password: string,
  name = "",
  hostelName = "আমার হোস্টেল",
): Promise<HostelDTO> {
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  await connectDB();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const admin = await Admin.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { $set: { passwordHash, ...(name ? { name } : {}) } },
    { upsert: true, returnDocument: "after" },
  ).lean<AdminLean>();
  const existing = await Hostel.findOne({ ownerId: admin!._id }).lean<{ _id: Types.ObjectId }>();
  return existing
    ? (await getHostelByOwner(String(admin!._id)))!
    : createHostel(String(admin!._id), hostelName);
}

export interface ProfileDTO {
  name: string;
  email: string;
  createdAt: string;
}

export async function getProfile(userId: string): Promise<ProfileDTO | null> {
  if (!Types.ObjectId.isValid(userId)) return null;
  await connectDB();
  const admin = await Admin.findById(userId, { name: 1, email: 1, createdAt: 1 }).lean<{
    name: string;
    email: string;
    createdAt: Date;
  }>();
  return admin
    ? { name: admin.name, email: admin.email, createdAt: admin.createdAt.toISOString() }
    : null;
}

/**
 * Updates the user's name and email. Changing the email (which is the login)
 * requires the current password and must not collide with another account.
 */
export async function updateProfile(userId: string, input: unknown): Promise<ProfileDTO> {
  const data = parseOrThrow(updateProfileSchema, input);
  await connectDB();
  const admin = await Admin.findById(userId).lean<AdminLean>();
  if (!admin) throw new ServiceError("NOT_FOUND", "অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।");

  if (data.email !== admin.email) {
    const ok = data.currentPassword
      ? await bcrypt.compare(data.currentPassword, admin.passwordHash)
      : false;
    if (!ok) {
      throw new ServiceError("VALIDATION", "ইমেইল পরিবর্তন করতে বর্তমান পাসওয়ার্ড সঠিকভাবে লিখুন।");
    }
    if (await Admin.exists({ email: data.email, _id: { $ne: admin._id } })) {
      throw new ServiceError("VALIDATION", "এই ইমেইল দিয়ে অন্য একটি অ্যাকাউন্ট আছে।");
    }
  }

  await Admin.updateOne({ _id: admin._id }, { $set: { name: data.name, email: data.email } });
  return (await getProfile(userId))!;
}

export async function changeAdminPassword(email: string, input: unknown): Promise<void> {
  const data = parseOrThrow(changePasswordSchema, input);
  const admin = await verifyAdminCredentials(email, data.currentPassword);
  if (!admin) throw new ServiceError("VALIDATION", "বর্তমান পাসওয়ার্ড সঠিক নয়।");
  const passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
  await Admin.updateOne({ _id: admin.id }, { $set: { passwordHash } });
}
