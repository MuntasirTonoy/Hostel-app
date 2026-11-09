export type ServiceErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "DUPLICATE_PERIOD"
  | "PUBLISHED_LOCKED"
  | "NOT_PUBLISHABLE"
  | "MEMBER_IN_USE"
  | "UNAUTHORIZED";

/**
 * An expected, user-facing error. `message` is always Bangla and safe to show;
 * `runAction` translates it to the visitor's language (see src/i18n/messages.ts).
 */
export class ServiceError extends Error {
  constructor(
    public code: ServiceErrorCode,
    message: string,
    public details?: string[],
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/** Canonical (Bangla) messages. Every entry needs an English translation in src/i18n/messages.ts. */
export const MESSAGES = {
  DUPLICATE_PERIOD: "এই মাস ও বছরের হিসাব ইতোমধ্যে তৈরি করা হয়েছে।",
  ACCOUNT_NOT_FOUND: "হিসাবটি খুঁজে পাওয়া যায়নি।",
  MEMBER_NOT_FOUND: "সদস্য খুঁজে পাওয়া যায়নি।",
  CONTACT_NOT_FOUND: "যোগাযোগটি খুঁজে পাওয়া যায়নি।",
  PUBLISHED_LOCKED:
    "এই হিসাবটি প্রকাশিত। পরিবর্তন করতে আগে \"অপ্রকাশিত করুন\" নির্বাচন করে নিশ্চিত করুন।",
  MANAGER_REQUIRED: "হিসাব প্রকাশের আগে ম্যানেজারের নাম লিখুন।",
  MEMBER_IN_USE:
    "এই সদস্যের মাসিক হিসাবের ইতিহাস রয়েছে, তাই মুছে ফেলা যাবে না। পরিবর্তে নিষ্ক্রিয় করুন।",
  UNAUTHORIZED: "এই কাজটি করার অনুমতি আপনার নেই। অনুগ্রহ করে Admin হিসেবে লগইন করুন।",
  UNKNOWN: "একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
  INVALID_DATA: "তথ্য সঠিক নয়।",
  DATABASE: "ডাটাবেসের সাথে সংযোগ স্থাপন করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  EMAIL_REGISTERED: "এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট আছে। লগইন করুন।",
  EMAIL_IN_USE: "এই ইমেইল দিয়ে অন্য একটি অ্যাকাউন্ট আছে।",
  USER_NOT_FOUND: "অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।",
  EMAIL_CHANGE_PASSWORD: "ইমেইল পরিবর্তন করতে বর্তমান পাসওয়ার্ড সঠিকভাবে লিখুন।",
  WRONG_CURRENT_PASSWORD: "বর্তমান পাসওয়ার্ড সঠিক নয়।",
  HOSTEL_ID_TAKEN: "এই হোস্টেল আইডি অন্য একটি হোস্টেল ব্যবহার করছে। অন্য একটি আইডি বেছে নিন।",
} as const;
