// Local MongoDB for development (no install needed). Data persists in .devdb/.
// Usage: npm run dev:db   then set MONGODB_URI=mongodb://127.0.0.1:27017/vidora
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";

const dbPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.devdb");
fs.mkdirSync(dbPath, { recursive: true });
const server = await MongoMemoryServer.create({ instance: { port: 27017, dbPath, storageEngine: "wiredTiger" } });
console.log(`Local MongoDB ready at ${server.getUri()}vidora (data in .devdb/)`);
const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
