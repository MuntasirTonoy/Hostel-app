import { connectDB } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import type { ContactDTO } from "@/types/accounting";
import { listContacts } from "./contact-service";
import { getHostelByCode } from "./hostel-service";

export type PublicContact = ContactDTO;
export type PublicContactsData = {
  hostelName: string | null;
  contacts: PublicContact[];
};

/** The public list: active members who have a number, plus the separately added contacts. */
export async function getPublicContacts(code: string): Promise<PublicContactsData> {
  const hostel = await getHostelByCode(code);
  if (!hostel) return { hostelName: null, contacts: [] };
  await connectDB();
  const [members, others] = await Promise.all([
    Member.find({
      hostelId: hostel.id,
      isActive: true,
      hiddenFromContacts: { $ne: true },
      phone: { $nin: ["", null] },
    })
      .select("name phone")
      .lean<{ _id: unknown; name: string; phone: string }[]>(),
    listContacts(hostel.id),
  ]);
  return {
    hostelName: hostel.name,
    contacts: [
      ...members.map((d) => ({ id: String(d._id), name: d.name, phone: d.phone })),
      ...others,
    ].sort((a, b) => a.name.localeCompare(b.name, "bn")),
  };
}
