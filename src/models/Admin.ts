import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Administrator login credentials (password stored as a bcrypt hash).
 * `passwordHash` is empty for accounts created through Google sign-in.
 */
const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true, default: "" },
    passwordHash: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Admin: Model<InferSchemaType<typeof adminSchema>> =
  models.Admin || model("Admin", adminSchema);
