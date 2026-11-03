import { randomInt } from "node:crypto";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Hostel } from "@/models/Hostel";
import { Member } from "@/models/Member";
import { MonthlyAccount } from "@/models/MonthlyAccount";
import { HOSTEL_ID_PATTERN, hostelIdFormSchema, hostelIdSchema, hostelSettingsSchema } from "@/schemas/auth";
import { MESSAGES, ServiceError } from "./errors";
import { parseOrThrow } from "./validation";

export interface HostelDTO {
  id: string;
  code: string;
  name: string;
}

type HostelLean = { _id: Types.ObjectId; code: string; name: string };

const toDTO = (h: HostelLean): HostelDTO => ({ id: String(h._id), code: h.code, name: h.name });

// No look-alike characters (0/o, 1/l/i) so generated IDs are easy to read and type.
// (Admins may later choose their own Hostel ID; see HOSTEL_ID_PATTERN.)
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateHostelCode(length = 6): string {
  return Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

/** Creates a hostel with a unique random code (retries on the rare collision). */
export async function createHostel(ownerId: string, name: string): Promise<HostelDTO> {
  await connectDB();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const doc = await Hostel.create({ code: generateHostelCode(), name, ownerId });
      return toDTO(doc.toObject() as HostelLean);
    } catch (error) {
      const keys = (error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {};
      if (isDuplicateKeyError(error) && "code" in keys) continue;
      throw error;
    }
  }
  throw new Error("Could not generate a unique hostel code");
}

export async function getHostelByOwner(ownerId: string): Promise<HostelDTO | null> {
  if (!Types.ObjectId.isValid(ownerId)) return null;
  await connectDB();
  const doc = await Hostel.findOne({ ownerId }).lean<HostelLean>();
  return doc ? toDTO(doc) : null;
}

export async function getHostelByCode(code: string): Promise<HostelDTO | null> {
  const normalized = code.trim().toLowerCase();
  if (!HOSTEL_ID_PATTERN.test(normalized)) return null;
  await connectDB();
  const doc = await Hostel.findOne({ code: normalized }).lean<HostelLean>();
  return doc ? toDTO(doc) : null;
}

export interface HostelStats {
  activeMembers: number;
  totalMembers: number;
  publishedReports: number;
  draftReports: number;
}

export async function getHostelStats(hostelId: string): Promise<HostelStats> {
  await connectDB();
  const [activeMembers, totalMembers, publishedReports, draftReports] = await Promise.all([
    Member.countDocuments({ hostelId, isActive: true }),
    Member.countDocuments({ hostelId }),
    MonthlyAccount.countDocuments({ hostelId, status: "PUBLISHED" }),
    MonthlyAccount.countDocuments({ hostelId, status: "DRAFT" }),
  ]);
  return { activeMembers, totalMembers, publishedReports, draftReports };
}

export async function updateHostel(hostelId: string, input: unknown): Promise<HostelDTO> {
  const { name } = parseOrThrow(hostelSettingsSchema, input);
  await connectDB();
  const doc = await Hostel.findByIdAndUpdate(
    hostelId,
    { $set: { name } },
    { returnDocument: "after", runValidators: true },
  ).lean<HostelLean>();
  if (!doc) throw new Error("Hostel not found");
  return toDTO(doc);
}

/** True when no *other* hostel uses this Hostel ID (and the ID is well-formed). */
export async function isHostelIdAvailable(hostelId: string, code: string): Promise<boolean> {
  const parsed = hostelIdSchema.safeParse(code);
  if (!parsed.success) return false;
  await connectDB();
  return !(await Hostel.exists({ code: parsed.data, _id: { $ne: hostelId } }));
}

/**
 * Changes the hostel's public Hostel ID (the code in /monthly-bill/<id>). The old
 * link stops working. Availability is checked first; the unique index catches races.
 */
export async function updateHostelId(hostelId: string, input: unknown): Promise<HostelDTO> {
  const { code } = parseOrThrow(hostelIdFormSchema, input);
  if (!(await isHostelIdAvailable(hostelId, code))) {
    throw new ServiceError("VALIDATION", MESSAGES.HOSTEL_ID_TAKEN);
  }
  try {
    const doc = await Hostel.findByIdAndUpdate(
      hostelId,
      { $set: { code } },
      { returnDocument: "after", runValidators: true },
    ).lean<HostelLean>();
    if (!doc) throw new Error("Hostel not found");
    return toDTO(doc);
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new ServiceError("VALIDATION", MESSAGES.HOSTEL_ID_TAKEN);
    throw error;
  }
}
