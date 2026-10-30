"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/authz";
import type { CreateMemberInput, UpdateMemberInput } from "@/schemas/member";
import { createMember, deleteMember, updateMember } from "@/services/member-service";
import type { MemberDTO } from "@/types/accounting";

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
