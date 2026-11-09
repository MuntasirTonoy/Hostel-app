import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** A person on the hostel's contact list who is not a member (cook, landlord, …). */
const contactSchema = new Schema(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 16 },
  },
  { timestamps: true },
);

export const Contact: Model<InferSchemaType<typeof contactSchema>> =
  models.Contact || model("Contact", contactSchema);
