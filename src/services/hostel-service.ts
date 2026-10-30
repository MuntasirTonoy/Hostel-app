import { randomInt } from "node:crypto";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Hostel } from "@/models/Hostel";
import { hostelSettingsSchema } from "@/schemas/auth";
import { parseOrThrow } from "./validation";

export interface HostelDTO {
  id: string;
  code: string;
  name: string;
}

type HostelLean = { _id: Types.ObjectId; code: string; name: string };

const toDTO = (h: HostelLean): HostelDTO => ({ id: String(h._id), code: h.code, name: h.name });

// No look-alike characters (0/o, 1/l/i) so codes are easy to read and type.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const HOSTEL_CODE_PATTERN = /^[a-hjkmnp-z2-9]{6}$/;

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
  if (!HOSTEL_CODE_PATTERN.test(normalized)) return null;
  await connectDB();
  const doc = await Hostel.findOne({ code: normalized }).lean<HostelLean>();
  return doc ? toDTO(doc) : null;
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
