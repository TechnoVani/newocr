import { connectDB } from "../config/database.js";
import { ensureHrSchema } from "../models/human-resources/hrSchema.model.js";

await connectDB();
await ensureHrSchema();
console.log("HR schema is ready.");
process.exit(0);
