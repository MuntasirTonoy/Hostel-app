import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";
import { connectDB, disconnectDB } from "@/lib/mongodb";
import { Admin } from "@/models/Admin";
import { Hostel } from "@/models/Hostel";
import { Member } from "@/models/Member";
import { MonthlyAccount } from "@/models/MonthlyAccount";

/** Starts an in-memory MongoDB for the current test file and clears it between tests. */
export function setupTestDatabase() {
  let server: MongoMemoryServer;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    process.env.MONGO_URI = server.getUri();
    process.env.MONGO_DB_NAME = "hostel-test";
    await connectDB();
    await Promise.all([Member.init(), MonthlyAccount.init(), Admin.init(), Hostel.init()]);
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await disconnectDB();
    await server?.stop();
  });
}

/** Creates a hostel owned by a throwaway owner id and returns it. */
export async function makeHostel(name = "টেস্ট হোস্টেল") {
  const { Types } = await import("mongoose");
  const { createHostel } = await import("@/services/hostel-service");
  return createHostel(new Types.ObjectId().toString(), name);
}
