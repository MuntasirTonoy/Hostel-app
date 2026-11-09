import { beforeEach, describe, expect, it } from "vitest";
import type { HostelDTO } from "@/services/hostel-service";
import { createContact, deleteContact, listContacts, updateContact } from "@/services/contact-service";
import { createMember, listMembers, updateMember } from "@/services/member-service";
import { getPublicContacts } from "@/services/public-contacts-service";
import { ServiceError } from "@/services/errors";
import { makeHostel, setupTestDatabase } from "./helpers/db";

setupTestDatabase();

let hostel: HostelDTO;
beforeEach(async () => {
  hostel = await makeHostel();
});

describe("member phone numbers", () => {
  it("normalizes Bangla digits, spaces and hyphens", async () => {
    const member = await createMember(hostel.id, { name: "A", phone: "০১৭১২-৩৪৫ ৬৭৮" });
    expect(member.phone).toBe("01712345678");
  });

  it("rejects an invalid number and clears with an empty one", async () => {
    const member = await createMember(hostel.id, { name: "A", phone: "01712345678" });
    await expect(updateMember(hostel.id, { id: member.id, phone: "abc" })).rejects.toBeInstanceOf(ServiceError);
    expect((await updateMember(hostel.id, { id: member.id, phone: "" })).phone).toBe("");
  });

  it("another hostel cannot change a number", async () => {
    const member = await createMember(hostel.id, { name: "A", phone: "01712345678" });
    const other = await makeHostel("অন্য");
    await expect(updateMember(other.id, { id: member.id, phone: "01811111111" })).rejects.toBeInstanceOf(ServiceError);
  });
});

describe("separate contacts", () => {
  it("never join the member list, but appear publicly", async () => {
    await createMember(hostel.id, { name: "Member", phone: "01712345678" });
    await createContact(hostel.id, { name: "Cook", phone: "01811111111" });

    expect((await listMembers(hostel.id)).map((m) => m.name)).toEqual(["Member"]);
    const { contacts } = await getPublicContacts(hostel.code);
    expect(contacts.map((c) => c.name).sort()).toEqual(["Cook", "Member"]);
  });

  it("must have a number; can be edited and deleted", async () => {
    await expect(createContact(hostel.id, { name: "Cook", phone: "" })).rejects.toBeInstanceOf(ServiceError);
    const c = await createContact(hostel.id, { name: "Cook", phone: "01811111111" });
    const updated = await updateContact(hostel.id, { id: c.id, name: "Chef", phone: "01822222222" });
    expect(updated).toMatchObject({ name: "Chef", phone: "01822222222" });
    await deleteContact(hostel.id, c.id);
    expect(await listContacts(hostel.id)).toEqual([]);
  });

  it("another hostel cannot edit or delete them", async () => {
    const c = await createContact(hostel.id, { name: "Cook", phone: "01811111111" });
    const other = await makeHostel("অন্য");
    await expect(updateContact(other.id, { id: c.id, name: "X", phone: "01822222222" })).rejects.toBeInstanceOf(ServiceError);
    await expect(deleteContact(other.id, c.id)).rejects.toBeInstanceOf(ServiceError);
    expect(await listContacts(hostel.id)).toHaveLength(1);
  });
});

describe("public contacts", () => {
  it("lists only active members with a number, and only their name and phone", async () => {
    await createMember(hostel.id, { name: "With", phone: "01712345678" });
    await createMember(hostel.id, { name: "Without" });
    const left = await createMember(hostel.id, { name: "Left", phone: "01811111111" });
    await updateMember(hostel.id, { id: left.id, isActive: false });

    const { hostelName, contacts } = await getPublicContacts(hostel.code);
    expect(hostelName).toBe(hostel.name);
    expect(contacts.map((c) => c.name)).toEqual(["With"]);
    expect(Object.keys(contacts[0]).sort()).toEqual(["id", "name", "phone"]);
  });

  it("hides a removed member from contacts only, and can add them back", async () => {
    const member = await createMember(hostel.id, { name: "A", phone: "01712345678" });
    await updateMember(hostel.id, { id: member.id, hiddenFromContacts: true });

    expect((await getPublicContacts(hostel.code)).contacts).toEqual([]);
    const [listed] = await listMembers(hostel.id, { activeOnly: true });
    expect(listed).toMatchObject({ name: "A", isActive: true, phone: "01712345678", hiddenFromContacts: true });

    await updateMember(hostel.id, { id: member.id, hiddenFromContacts: false });
    expect((await getPublicContacts(hostel.code)).contacts).toHaveLength(1);
  });

  it("does not mix hostels and handles an unknown ID", async () => {
    const other = await makeHostel("অন্য");
    await createMember(other.id, { name: "Theirs", phone: "01712345678" });
    expect((await getPublicContacts(hostel.code)).contacts).toEqual([]);
    expect((await getPublicContacts("no-such-hostel")).hostelName).toBeNull();
  });
});
