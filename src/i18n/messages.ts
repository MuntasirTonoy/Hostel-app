import { ISSUE_MESSAGES } from "@/features/accounting/calculate";
import { DECIMAL_FIELD_LABELS, decimalMessages } from "@/schemas/accounting";
import { MESSAGES } from "@/services/errors";
import type { Locale } from "./config";

/**
 * Server and validation messages are written once, in Bangla (services, Zod
 * schemas, the calculator). This table gives each one its English text, so
 * `translateMessage` can show it in the visitor's language. Unknown messages
 * are returned unchanged.
 */
const DECIMAL_LABELS_EN: Record<(typeof DECIMAL_FIELD_LABELS)[number], string> = {
  "জমা": "Deposit",
  "মিল সংখ্যা": "Meal count",
  "বাজার খরচ": "Market expense",
  "চালের খরচ": "Rice expense",
  "জ্বালানি খরচ": "Fuel expense",
  "অন্যান্য অতিরিক্ত খরচ": "Other extra expense",
};

const EN: Record<string, string> = {
  // Service errors
  [MESSAGES.DUPLICATE_PERIOD]: "A record for this month and year already exists.",
  [MESSAGES.ACCOUNT_NOT_FOUND]: "The record could not be found.",
  [MESSAGES.MEMBER_NOT_FOUND]: "Member not found.",
  [MESSAGES.CONTACT_NOT_FOUND]: "Contact not found.",
  [MESSAGES.PUBLISHED_LOCKED]:
    'This record is published. To change it, first choose "Unpublish" and confirm.',
  [MESSAGES.MANAGER_REQUIRED]: "Enter the manager's name before publishing.",
  [MESSAGES.MEMBER_IN_USE]:
    "This member has monthly records, so they can't be deleted. Deactivate them instead.",
  [MESSAGES.UNAUTHORIZED]: "You don't have permission to do this. Please log in as Admin.",
  [MESSAGES.UNKNOWN]: "Something unexpected went wrong. Please try again.",
  [MESSAGES.INVALID_DATA]: "The data is not valid.",
  [MESSAGES.DATABASE]: "Couldn't connect to the database. Please try again in a moment.",
  [MESSAGES.EMAIL_REGISTERED]: "An account with this email already exists. Please log in.",
  [MESSAGES.EMAIL_IN_USE]: "Another account already uses this email.",
  [MESSAGES.USER_NOT_FOUND]: "Account not found.",
  [MESSAGES.EMAIL_CHANGE_PASSWORD]: "Enter your current password correctly to change the email.",
  [MESSAGES.WRONG_CURRENT_PASSWORD]: "The current password is incorrect.",
  [MESSAGES.HOSTEL_ID_TAKEN]: "Another hostel is using this Hostel ID. Choose a different one.",
  "সঠিক ফোন নম্বর লিখুন।": "Enter a valid phone number.",
  "ফোন নম্বর লিখুন।": "Enter the phone number.",

  // Calculator issues
  [ISSUE_MESSAGES.NO_MEMBERS]: "Add at least one member.",
  [ISSUE_MESSAGES.ZERO_MEALS]:
    "Total meals is zero, so the meal rate can't be calculated. Add meal counts before publishing.",
  [ISSUE_MESSAGES.DUPLICATE_MEMBER]: "The same member was added more than once.",
  [ISSUE_MESSAGES.RECONCILIATION_FAILED]: "The totals don't reconcile. Please check the figures again.",

  // Zod: auth
  "সঠিক ইমেইল ঠিকানা লিখুন।": "Enter a valid email address.",
  "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।": "The password must be at least 8 characters.",
  "পাসওয়ার্ড লিখুন।": "Enter your password.",
  "হোস্টেলের নাম লিখুন।": "Enter the hostel name.",
  "হোস্টেলের নাম অনেক বড়।": "The hostel name is too long.",
  "আপনার নাম লিখুন।": "Enter your name.",
  "নাম অনেক বড়।": "The name is too long.",
  "দুটি পাসওয়ার্ড মিলছে না।": "The two passwords don't match.",
  "বর্তমান পাসওয়ার্ড লিখুন।": "Enter your current password.",
  "হোস্টেল আইডি কমপক্ষে ৩ অক্ষরের হতে হবে।": "The Hostel ID must be at least 3 characters.",
  "হোস্টেল আইডি সর্বোচ্চ ৩০ অক্ষরের হতে পারে।": "The Hostel ID can be at most 30 characters.",
  "শুধু ইংরেজি ছোট হাতের অক্ষর (a-z), সংখ্যা (0-9) ও মাঝে হাইফেন (-) ব্যবহার করুন।":
    "Use only lowercase letters (a-z), digits (0-9) and hyphens (-) in between.",

  // Zod: members
  "সদস্যের নাম লিখুন।": "Enter the member's name.",
  "নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে।": "The name can be at most 100 characters.",

  // Zod: accounting
  "অবৈধ আইডি।": "Invalid ID.",
  "মাস নির্বাচন করুন।": "Select a month.",
  "বছর লিখুন।": "Enter the year.",
  "বছর সঠিক নয়।": "The year is not valid.",
  "ম্যানেজারের নাম অনেক বড়।": "The manager's name is too long.",
  // "কমপক্ষে একজন সদস্য যুক্ত করুন।" is the same text as ISSUE_MESSAGES.NO_MEMBERS above.
  "কমপক্ষে একজন সদস্য নির্বাচন করুন।": "Select at least one member.",
  "একই সদস্য একাধিকবার যুক্ত করা যাবে না।": "The same member can't be added more than once.",
  ...Object.fromEntries(
    DECIMAL_FIELD_LABELS.flatMap((label) => [
      [decimalMessages.negative(label), `${DECIMAL_LABELS_EN[label]} can't be negative.`],
      [
        decimalMessages.invalid(label),
        `Enter ${DECIMAL_LABELS_EN[label].toLowerCase()} as a number (at most two decimal places).`,
      ],
    ]),
  ),
};

/** Shows a (Bangla) server/validation message in the given language. */
export function translateMessage(message: string, locale: Locale): string;
export function translateMessage(message: string | undefined, locale: Locale): string | undefined;
export function translateMessage(message: string | undefined, locale: Locale): string | undefined {
  if (message === undefined || locale === "bn") return message;
  return EN[message] ?? message;
}

/** Exposed for tests: every message that has an English translation. */
export const TRANSLATED_MESSAGES: readonly string[] = Object.keys(EN);
