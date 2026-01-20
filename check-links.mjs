import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1. Load revs.json from the root
  const revsPath = path.join(__dirname, "revs.json");
  const raw = await fs.readFile(revsPath, "utf-8");
  const revs = JSON.parse(raw);

  if (!Array.isArray(revs)) {
    throw new Error("revs.json is not a JSON array at the top level.");
  }

  // 2. Build a set of all rev IDs
  const allIds = new Set(revs.map((rev) => rev.id));
  const allLinkTypes = []

  // 3. Track missing link targets: { targetId -> [sourceRevId, ...] }
  const missingTargets = new Map();

  for (const rev of revs) {
    const sourceId = rev.id;
    const links = Array.isArray(rev.links) ? rev.links : [];

    for (const link of links) {
      const targetId = link.targetId;
      const type = link.type

      if (!allLinkTypes.includes(link.type)) {
        allLinkTypes.push(link.type)
      }

      if (!targetId) continue;

      if (!allIds.has(targetId)) {
        if (!missingTargets.has(targetId)) {
          missingTargets.set(targetId, []);
        }
        missingTargets.get(targetId).push(sourceId);
      }
    }
  }
  console.log(allLinkTypes)

  // 4. Report results
  if (missingTargets.size === 0) {
    console.log("✅ All links.targetId values point to existing revs.");
  } else {
    console.log("⚠ Found links pointing to missing revs:\n");
    for (const [targetId, sources] of missingTargets.entries()) {
      console.log(`- Missing targetId "${targetId}" referenced by:`);
      for (const src of sources) {
        console.log(`    • ${src}`);
      }
      console.log()
    }
  }
}



main().catch((err) => {
  console.error("❌ Error during link sanity check:", err);
  process.exit(1);
});
