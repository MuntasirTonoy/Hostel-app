import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email("সঠিক ইমেইল ঠিকানা লিখুন।");
const newPasswordSchema = z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।").max(200);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "পাসওয়ার্ড লিখুন।"),
});

export const hostelNameSchema = z
  .string()
  .trim()
  .min(1, "হোস্টেলের নাম লিখুন।")
  .max(150, "হোস্টেলের নাম অনেক বড়।");

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "আপনার নাম লিখুন।").max(100, "নাম অনেক বড়।"),
    email: emailSchema,
    hostelName: hostelNameSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "দুটি পাসওয়ার্ড মিলছে না।",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "বর্তমান পাসওয়ার্ড লিখুন।"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "দুটি পাসওয়ার্ড মিলছে না।",
    path: ["confirmPassword"],
  });

export const hostelSettingsSchema = z.object({ name: hostelNameSchema });

/**
 * Hostel ID: the public identifier in report links (/monthly-bill/<id>). Generated
 * as a random 6-character code on sign-up and changeable by the admin: 3–30
 * lowercase letters, digits and single hyphens (not at either end).
 */
export const HOSTEL_ID_PATTERN = /^(?=.{3,30}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const hostelIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "হোস্টেল আইডি কমপক্ষে ৩ অক্ষরের হতে হবে।")
  .max(30, "হোস্টেল আইডি সর্বোচ্চ ৩০ অক্ষরের হতে পারে।")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "শুধু ইংরেজি ছোট হাতের অক্ষর (a-z), সংখ্যা (0-9) ও মাঝে হাইফেন (-) ব্যবহার করুন।",
  );

export const hostelIdFormSchema = z.object({ code: hostelIdSchema });

/** Profile edit. The current password is required only when the email changes (checked in the service). */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "আপনার নাম লিখুন।").max(100, "নাম অনেক বড়।"),
  email: emailSchema,
  currentPassword: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
