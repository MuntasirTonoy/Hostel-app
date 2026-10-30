import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { MonthlyAccount } from "@/models/MonthlyAccount";
import {
  createMemberSchema,
  updateMemberSchema,
  type CreateMemberInput,
  type UpdateMemberInput,
} from "@/schemas/member";
import type { MemberDTO } from "@/types/accounting";
import { MESSAGES, ServiceError } from "./errors";
import { parseOrThrow } from "./validation";

/*
 * Every function takes the caller's hostelId and only ever touches members of
 * that hostel, so one hostel can never read or change another hostel's data.
 */

type MemberLean = {
  _id: Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(doc: MemberLean): MemberDTO {
  return {
    id: String(doc._id),
    name: doc.name,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listMembers(
  hostelId: string,
  options: { activeOnly?: boolean } = {},
): Promise<MemberDTO[]> {
  await connectDB();
  const filter: Record<string, unknown> = { hostelId };
  if (options.activeOnly) filter.isActive = true;
  const docs = await Member.find(filter).sort({ isActive: -1, name: 1 }).lean<MemberLean[]>();
  return docs.map(toDTO);
}

export async function countActiveMembers(hostelId: string): Promise<number> {
  await connectDB();
  return Member.countDocuments({ hostelId, isActive: true });
}

export async function createMember(hostelId: string, input: CreateMemberInput): Promise<MemberDTO> {
  const { name } = parseOrThrow(createMemberSchema, input);
  await connectDB();
  const doc = await Member.create({ hostelId, name, isActive: true });
  return toDTO(doc.toObject() as MemberLean);
}

export async function updateMember(hostelId: string, input: UpdateMemberInput): Promise<MemberDTO> {
  const { id, ...changes } = parseOrThrow(updateMemberSchema, input);
  await connectDB();
  const doc = await Member.findOneAndUpdate({ _id: id, hostelId }, changes, {
    returnDocument: "after",
    runValidators: true,
  }).lean<MemberLean>();
  if (!doc) throw new ServiceError("NOT_FOUND", MESSAGES.MEMBER_NOT_FOUND);
  return toDTO(doc);
}

/** Deletes a member only if they never appeared in any monthly record. */
export async function deleteMember(hostelId: string, id: string): Promise<void> {
  if (!Types.ObjectId.isValid(id)) throw new ServiceError("NOT_FOUND", MESSAGES.MEMBER_NOT_FOUND);
  await connectDB();
  const used = await MonthlyAccount.exists({ hostelId, "members.memberId": new Types.ObjectId(id) });
  if (used) throw new ServiceError("MEMBER_IN_USE", MESSAGES.MEMBER_IN_USE);
  const res = await Member.deleteOne({ _id: id, hostelId });
  if (res.deletedCount === 0) throw new ServiceError("NOT_FOUND", MESSAGES.MEMBER_NOT_FOUND);
}
