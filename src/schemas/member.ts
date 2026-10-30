import { z } from "zod";
import { objectIdSchema } from "./accounting";

export const memberNameSchema = z
  .string()
  .trim()
  .min(1, "সদস্যের নাম লিখুন।")
  .max(100, "নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে।");

export const createMemberSchema = z.object({ name: memberNameSchema });

export const updateMemberSchema = z.object({
  id: objectIdSchema,
  name: memberNameSchema.optional(),
  isActive: z.boolean().optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
