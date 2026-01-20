import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env (adjust if needed)
dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  const db = mongoose.connection;
  console.log("Connected.");

  try {
    // 1) Load rev.lemmas.json from project root
    const lemmasPath = path.join(__dirname, "../rev.lemmas.json");
    const raw = await fs.readFile(lemmasPath, "utf-8");
    const lemmaEntries = JSON.parse(raw);

    if (!Array.isArray(lemmaEntries)) {
      throw new Error("rev.lemmas.json must be a top-level JSON array.");
    }

    console.log(`📚 Loaded ${lemmaEntries.length} lemma metadata entries.`);

    const collection = db.collection("revs");

    // 2) Build bulk update operations
    const ops = [];
    let missingCount = 0;

    for (const entry of lemmaEntries) {
      const { revId, families, lineageRank, lemma } = entry;

      if (!revId) continue;

      ops.push({
        updateOne: {
          filter: { id: revId },
          update: {
            $set: {
              "metadata.families": families || [],
              "metadata.lineageRank":
                typeof lineageRank === "number" ? lineageRank : undefined,
              "metadata.lemma": lemma || undefined,
            },
          },
        },
      });
    }

    if (ops.length === 0) {
      console.log("No lemma updates to apply.");
      return;
    }

    console.log(`🔧 Applying ${ops.length} lemma metadata updates...`);
    const result = await collection.bulkWrite(ops, { ordered: false });

    console.log("✅ Lemma merge complete.");
    console.log(
      `Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
    );

    // Optional: sanity check for revIds that didn't match anything
    const allRevIds = new Set(
      (await collection.find({}, { projection: { id: 1 } }).toArray()).map(
        (doc) => doc.id
      )
    );
    const missingRevIds = lemmaEntries
      .map((e) => e.revId)
      .filter((id) => !allRevIds.has(id));

    if (missingRevIds.length > 0) {
      console.log(
        "\n⚠ Lemma entries with revIds not present in revs collection:"
      );
      for (const id of missingRevIds) {
        console.log(`  - ${id}`);
      }
    } else {
      console.log("\n✨ All lemma revIds have matching rev documents.");
    }
  } finally {
    console.log("\nClosing MongoDB connection.");
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Error in merge-lemmas:", err);
  process.exit(1);
});
