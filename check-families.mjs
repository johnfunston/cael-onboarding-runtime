import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1. Load revs.json from the root
  const lemmasPath = path.join(__dirname, "rev.lemmas.json");
  const raw = await fs.readFile(lemmasPath, "utf-8");
  const lemmas = JSON.parse(raw);

  if (!Array.isArray(lemmas)) {
    throw new Error("families.json is not a JSON array at the top level.");
  }

  const allIds = new Set(lemmas.map((lemma) => lemma.id))
  const familyOccurenceCount = {}

  for (const lemma of lemmas) {
    const families = Array.isArray(lemma.families) ? lemma.families : [];
    for (const family of families) {
        if (!familyOccurenceCount[family]) {
            familyOccurenceCount[family] = 0;
    }
    familyOccurenceCount[family] += 1;
  }
  }

const uniqueFamilies = Object.keys(familyOccurenceCount);
console.log(`Total unique families: ${uniqueFamilies.length}\n`);

for (const family of uniqueFamilies) {
    console.log(`${family}`);
}
    return familyOccurenceCount;
}

main().catch((err) => {
  console.error("❌ Error during link sanity check:", err);
  process.exit(1);
});