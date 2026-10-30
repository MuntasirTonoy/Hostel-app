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
