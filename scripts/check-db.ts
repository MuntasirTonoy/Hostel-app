/** Verifies the MongoDB connection: npm run db:check */
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/lib/mongodb";

connectDB()
  .then(async () => {
    const db = mongoose.connection.db!;
    const collections = (await db.listCollections().toArray()).map((c) => c.name);
    console.log(`Connected. Database "${db.databaseName}", collections: ${collections.join(", ") || "(none yet)"}`);
  })
  .catch((error) => {
    console.error("Connection failed:", error.cause?.message ?? error.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
