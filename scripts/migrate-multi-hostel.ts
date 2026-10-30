/**
 * One-time migration from the single-hostel version to multiple hostels.
 *
 *   npm run db:migrate
 *
 * - Creates a hostel for every user that has none (name taken from the old
 *   `settings` document, or "আমার হোস্টেল").
 * - Assigns members and monthly records without a hostelId to that hostel.
 *   This only happens automatically when there is exactly one user.
 * - Drops the old unique index (year, month) and builds the new per-hostel indexes.
 * Safe to run more than once.
 */
import mongoose, { Types } from "mongoose";
import { connectDB, disconnectDB } from "../src/lib/mongodb";
import { Admin } from "../src/models/Admin";
import { Hostel } from "../src/models/Hostel";
import { Member } from "../src/models/Member";
import { MonthlyAccount } from "../src/models/MonthlyAccount";
import { createHostel } from "../src/services/hostel-service";

async function main() {
  await connectDB();
  const db = mongoose.connection.db!;

  const legacySettings = await db.collection("settings").findOne({ key: "app" });
  const defaultName = (legacySettings?.hostelName as string) || "আমার হোস্টেল";

  const admins = await Admin.find({}, { email: 1 }).lean<{ _id: Types.ObjectId; email: string }[]>();
  for (const admin of admins) {
    if (!(await Hostel.exists({ ownerId: admin._id }))) {
      const hostel = await createHostel(String(admin._id), defaultName);
      console.log(`Created hostel "${hostel.name}" (code ${hostel.code}) for ${admin.email}`);
    }
  }

  const orphanFilter = { hostelId: { $exists: false } };
  const orphanMembers = await Member.collection.countDocuments(orphanFilter);
  const orphanAccounts = await MonthlyAccount.collection.countDocuments(orphanFilter);
  if (orphanMembers || orphanAccounts) {
    if (admins.length !== 1) {
      console.warn(
        `Found ${orphanMembers} members / ${orphanAccounts} records without a hostel, but there are ${admins.length} users — assign them manually.`,
      );
    } else {
      const hostel = await Hostel.findOne({ ownerId: admins[0]._id }).lean<{ _id: Types.ObjectId }>();
      await Member.collection.updateMany(orphanFilter, { $set: { hostelId: hostel!._id } });
      await MonthlyAccount.collection.updateMany(orphanFilter, { $set: { hostelId: hostel!._id } });
      console.log(`Assigned ${orphanMembers} members and ${orphanAccounts} records to ${admins[0].email}'s hostel`);
    }
  }

  const indexes = await MonthlyAccount.collection.indexes();
  for (const name of ["year_1_month_1", "status_1_year_-1_month_-1"]) {
    if (indexes.some((i) => i.name === name)) {
      await MonthlyAccount.collection.dropIndex(name);
      console.log(`Dropped old index ${name}`);
    }
  }
  await Promise.all([Hostel.syncIndexes(), Member.syncIndexes(), MonthlyAccount.syncIndexes()]);
  console.log("Indexes are up to date. Migration complete.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
