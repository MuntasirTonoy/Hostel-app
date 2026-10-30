import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Monthly accounting record. Every money field is stored as integer paisa
 * (1 ৳ = 100 paisa). Member entries are snapshots: they keep the member's name
 * as it was for that month so later registry edits never change history.
 * All derived figures are computed by the accounting service (not by Mongoose
 * middleware) and persisted together with the inputs.
 */

const paisa = { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger };

const monthlyMemberSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    name: { type: String, required: true, trim: true },
    investment: paisa,
    mealCount: { type: Number, required: true, min: 0, default: 0 },
    mealCost: paisa,
    extraCost: paisa,
    totalCost: paisa,
    outstandingBalance: paisa,
    refundAmount: paisa,
  },
  { _id: false },
);

const expensesSchema = new Schema(
  {
    marketExpense: paisa,
    riceExpense: paisa,
    fuelExpense: paisa,
    otherExtraExpense: paisa,
  },
  { _id: false },
);

const monthlyAccountSchema = new Schema(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    managerName: { type: String, trim: true, default: "", maxlength: 100 },
    members: {
      type: [monthlyMemberSchema],
      default: [],
      validate: {
        validator: (members: { memberId: unknown }[]) =>
          new Set(members.map((m) => String(m.memberId))).size === members.length,
        message: "একই সদস্য একাধিকবার যুক্ত করা যাবে না।",
      },
    },
    expenses: { type: expensesSchema, required: true, default: () => ({}) },
    mealRate: { type: Number, default: null },
    totalMembers: { type: Number, required: true, default: 0 },
    totalMeals: { type: Number, required: true, default: 0 },
    totalDeposits: paisa,
    totalFoodCost: paisa,
    totalExtraCost: paisa,
    extraCostPerMember: { type: Number, default: null },
    totalMemberCost: paisa,
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], required: true, default: "DRAFT" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One accounting record per period per hostel.
monthlyAccountSchema.index({ hostelId: 1, year: 1, month: 1 }, { unique: true });
// Fast lookup of the latest published report.
monthlyAccountSchema.index({ hostelId: 1, status: 1, year: -1, month: -1 });

export type MonthlyAccountSchema = InferSchemaType<typeof monthlyAccountSchema>;

export const MonthlyAccount: Model<MonthlyAccountSchema> =
  models.MonthlyAccount || model("MonthlyAccount", monthlyAccountSchema);
