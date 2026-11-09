"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/authz";
import type {
  CreateContactInput,
  CreateMemberInput,
  UpdateContactInput,
  UpdateMemberInput,
} from "@/schemas/member";
import { createContact, deleteContact, updateContact } from "@/services/contact-service";
import { createMember, deleteMember, updateMember } from "@/services/member-service";
import type { ContactDTO, MemberDTO } from "@/types/accounting";

export async function createContactAction(input: CreateContactInput): Promise<ActionResult<ContactDTO>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const contact = await createContact(hostel.id, input);
    revalidatePath("/admin/contacts");
    return contact;
  });
}

export async function updateContactAction(input: UpdateContactInput): Promise<ActionResult<ContactDTO>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const contact = await updateContact(hostel.id, input);
    revalidatePath("/admin/contacts");
    return contact;
  });
}

export async function deleteContactAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    await deleteContact(hostel.id, id);
    revalidatePath("/admin/contacts");
    return undefined;
  });
}

export async function createMemberAction(input: CreateMemberInput): Promise<ActionResult<MemberDTO>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const member = await createMember(hostel.id, input);
    revalidatePath("/admin", "layout");
    return member;
  });
}

export async function updateMemberAction(input: UpdateMemberInput): Promise<ActionResult<MemberDTO>> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    const member = await updateMember(hostel.id, input);
    revalidatePath("/admin", "layout");
    return member;
  });
}

export async function deleteMemberAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const { hostel } = await requireAdmin();
    await deleteMember(hostel.id, id);
    revalidatePath("/admin", "layout");
    return undefined;
  });
}
