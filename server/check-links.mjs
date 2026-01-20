import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env (or adjust if it's elsewhere)
dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  const db = mongoose.connection;
  console.log("Connected.");

  try {
    const collection = db.collection("revs");

    // Distinct normalized types
    const distinctTypes = await collection.distinct("links.type");
    console.log("\n🔹 Distinct link.type values:");
    console.log(distinctTypes);

    // Distinct flavors (original strings)
    const distinctFlavors = await collection.distinct("links.flavor");
    console.log("\n🔹 Distinct link.flavor values (sample of first 50):");
    console.log(distinctFlavors.slice(0, 50)); // just to avoid a wall of text

    // Optional: show a couple of examples mapping flavor -> type
    const sample = await collection
      .find({ "links.0": { $exists: true } })
      .limit(3)
      .project({ id: 1, "links.type": 1, "links.flavor": 1 })
      .toArray();

    console.log("\n🔹 Sample revs with links:");
    for (const doc of sample) {
      console.log(`\nrev: ${doc.id}`);
      console.log(doc.links);
    }
  } finally {
    console.log("\nClosing MongoDB connection.");
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Error in check-links:", err);
  process.exit(1);
});
