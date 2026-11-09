import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Contact } from "@/models/Contact";
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from "@/schemas/member";
import type { ContactDTO } from "@/types/accounting";
import { MESSAGES, ServiceError } from "./errors";
import { parseOrThrow } from "./validation";

/* Contacts added on the Contacts page. They never touch the member registry. */

type ContactLean = { _id: Types.ObjectId; name: string; phone: string };

function toDTO(doc: ContactLean): ContactDTO {
  return { id: String(doc._id), name: doc.name, phone: doc.phone };
}

export async function listContacts(hostelId: string): Promise<ContactDTO[]> {
  await connectDB();
  const docs = await Contact.find({ hostelId }).sort({ name: 1 }).lean<ContactLean[]>();
  return docs.map(toDTO);
}

export async function createContact(hostelId: string, input: CreateContactInput): Promise<ContactDTO> {
  const values = parseOrThrow(createContactSchema, input);
  await connectDB();
  const doc = await Contact.create({ hostelId, ...values });
  return toDTO(doc.toObject() as ContactLean);
}

export async function updateContact(hostelId: string, input: UpdateContactInput): Promise<ContactDTO> {
  const { id, ...changes } = parseOrThrow(updateContactSchema, input);
  await connectDB();
  const doc = await Contact.findOneAndUpdate({ _id: id, hostelId }, changes, {
    returnDocument: "after",
    runValidators: true,
  }).lean<ContactLean>();
  if (!doc) throw new ServiceError("NOT_FOUND", MESSAGES.CONTACT_NOT_FOUND);
  return toDTO(doc);
}

export async function deleteContact(hostelId: string, id: string): Promise<void> {
  if (!Types.ObjectId.isValid(id)) throw new ServiceError("NOT_FOUND", MESSAGES.CONTACT_NOT_FOUND);
  await connectDB();
  const res = await Contact.deleteOne({ _id: id, hostelId });
  if (res.deletedCount === 0) throw new ServiceError("NOT_FOUND", MESSAGES.CONTACT_NOT_FOUND);
}
