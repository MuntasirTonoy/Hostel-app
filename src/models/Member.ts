import { Schema, deleteModel, model, models, type InferSchemaType, type Model } from "mongoose";

/** Permanent member registry of a hostel, independent of monthly accounting records. */
const memberSchema = new Schema(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, required: true, default: true },
    phone: { type: String, trim: true, maxlength: 16, default: "" },
    /** Removed from the Contacts page and public list only; still a normal member. */
    hiddenFromContacts: { type: Boolean, default: false },
  },
  { timestamps: true },
);

memberSchema.index({ hostelId: 1, isActive: 1 });

// Mongoose outlives hot reloads; without this the dev server keeps the old schema
// and silently drops newly added fields on save.
if (process.env.NODE_ENV !== "production" && models.Member) deleteModel("Member");

export const Member: Model<InferSchemaType<typeof memberSchema>> =
  models.Member || model("Member", memberSchema);
