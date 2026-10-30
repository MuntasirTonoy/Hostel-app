import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Permanent member registry of a hostel, independent of monthly accounting records. */
const memberSchema = new Schema(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

memberSchema.index({ hostelId: 1, isActive: 1 });

export const Member: Model<InferSchemaType<typeof memberSchema>> =
  models.Member || model("Member", memberSchema);
