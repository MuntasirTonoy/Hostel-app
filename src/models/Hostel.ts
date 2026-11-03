import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * A hostel. Each user (Admin) owns exactly one hostel, and all members and
 * monthly records belong to a hostel. `code` is the public Hostel ID used
 * in report links (/monthly-bill/<code>): random on sign-up, changeable by the admin.
 */
const hostelSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, unique: true },
  },
  { timestamps: true },
);

export const Hostel: Model<InferSchemaType<typeof hostelSchema>> =
  models.Hostel || model("Hostel", hostelSchema);
