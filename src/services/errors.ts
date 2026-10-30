export type ServiceErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "DUPLICATE_PERIOD"
  | "PUBLISHED_LOCKED"
  | "NOT_PUBLISHABLE"
  | "MEMBER_IN_USE"
  | "UNAUTHORIZED";

/** An expected, user-facing error. `message` is always Bangla and safe to show. */
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

export const MESSAGES = {
  DUPLICATE_PERIOD: "এই মাস ও বছরের হিসাব ইতোমধ্যে তৈরি করা হয়েছে।",
  ACCOUNT_NOT_FOUND: "হিসাবটি খুঁজে পাওয়া যায়নি।",
  MEMBER_NOT_FOUND: "সদস্য খুঁজে পাওয়া যায়নি।",
  PUBLISHED_LOCKED:
    "এই হিসাবটি প্রকাশিত। পরিবর্তন করতে আগে \"অপ্রকাশিত করুন\" নির্বাচন করে নিশ্চিত করুন।",
  MANAGER_REQUIRED: "হিসাব প্রকাশের আগে ম্যানেজারের নাম লিখুন।",
  MEMBER_IN_USE:
    "এই সদস্যের মাসিক হিসাবের ইতিহাস রয়েছে, তাই মুছে ফেলা যাবে না। পরিবর্তে নিষ্ক্রিয় করুন।",
  UNAUTHORIZED: "এই কাজটি করার অনুমতি আপনার নেই। অনুগ্রহ করে Admin হিসেবে লগইন করুন।",
  UNKNOWN: "একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
} as const;
