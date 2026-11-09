import { z } from "zod";
import { objectIdSchema } from "./accounting";

export const memberNameSchema = z
  .string()
  .trim()
  .min(1, "সদস্যের নাম লিখুন।")
  .max(100, "নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে।");

/** Accepts Bangla digits, spaces and hyphens; stores ASCII digits with an optional +. Empty clears it. */
export const memberPhoneSchema = z
  .string()
  .transform((v) =>
    v
      .replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
      .replace(/[\s-]/g, ""),
  )
  .pipe(z.string().regex(/^(\+?\d{6,15})?$/, "সঠিক ফোন নম্বর লিখুন।"));

export const createMemberSchema = z.object({
  name: memberNameSchema,
  phone: memberPhoneSchema.optional(),
});

/** A non-member contact: unlike a member, it must have a number. */
export const createContactSchema = z.object({
  name: memberNameSchema,
  phone: memberPhoneSchema.refine((v) => v !== "", "ফোন নম্বর লিখুন।"),
});

export const updateContactSchema = createContactSchema.extend({ id: objectIdSchema });

export const updateMemberSchema = z.object({
  id: objectIdSchema,
  name: memberNameSchema.optional(),
  isActive: z.boolean().optional(),
  phone: memberPhoneSchema.optional(),
  hiddenFromContacts: z.boolean().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
