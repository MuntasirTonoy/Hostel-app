import mongoose from "mongoose";
import { MESSAGES } from "@/services/errors";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Reuse one connection across hot reloads in development (and across
// invocations of the same server instance in production).
const globalForMongoose = globalThis as unknown as { __mongoose?: MongooseCache };
const cache: MongooseCache = globalForMongoose.__mongoose ?? { conn: null, promise: null };
globalForMongoose.__mongoose = cache;

export class DatabaseConnectionError extends Error {
  constructor(cause?: unknown) {
    super(MESSAGES.DATABASE);
    this.name = "DatabaseConnectionError";
    this.cause = cause;
  }
}

/**
 * `mongodb+srv://` URIs need a DNS SRV lookup. Some machines (notably Windows
 * with a local DNS proxy) refuse SRV queries from Node, so when the lookup
 * fails we switch Node's resolver to MONGO_DNS_SERVERS (default: public DNS).
 */
async function ensureSrvResolvable(uri: string): Promise<void> {
  const match = /^mongodb\+srv:\/\/(?:[^@/]*@)?([^/?]+)/.exec(uri);
  if (!match) return;
  const dns = await import("node:dns");
  const record = `_mongodb._tcp.${match[1]}`;
  try {
    await dns.promises.resolveSrv(record);
  } catch {
    const servers = (process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    dns.setServers(servers);
    console.warn(`[mongodb] SRV lookup failed with system DNS; using ${servers.join(", ")}`);
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new DatabaseConnectionError(new Error("MONGO_URI is not set"));

  if (!cache.promise) {
    cache.promise = ensureSrvResolvable(uri).then(() =>
      mongoose.connect(uri, {
        // All collections live in the "hostel" database unless overridden.
        dbName: process.env.MONGO_DB_NAME || "hostel",
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      }),
    );
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw new DatabaseConnectionError(error);
  }
  return cache.conn;
}

/** Closes the cached connection (used by tests and scripts). */
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
