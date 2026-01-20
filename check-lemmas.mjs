import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1. Load revs.json
  const revsPath = path.join(__dirname, "revs.json");
  const revsRaw = await fs.readFile(revsPath, "utf-8");
  const revs = JSON.parse(revsRaw);

  if (!Array.isArray(revs)) {
    throw new Error("revs.json must be a top-level JSON array.");
  }

  // 2. Load rev.lemmas.json
  const lemmasPath = path.join(__dirname, "rev.lemmas.json");
  const lemmasRaw = await fs.readFile(lemmasPath, "utf-8");
  const lemmas = JSON.parse(lemmasRaw);

  if (!Array.isArray(lemmas)) {
    throw new Error("rev.lemmas.json must be a top-level JSON array.");
  }

  // 3. Build sets of IDs
  const allRevIds = new Set(revs.map((rev) => rev.id));
  const lemmaRevIds = new Set(lemmas.map((entry) => entry.revId));

  // 4. Revs that have NO lemma entry at all
  const revsMissingLemma = [];
  for (const id of allRevIds) {
    if (!lemmaRevIds.has(id)) {
      revsMissingLemma.push(id);
    }
  }

  // 5. Lemma entries whose revId doesn't exist in revs.json
  const lemmaForUnknownRevId = [];
  for (const id of lemmaRevIds) {
    if (!allRevIds.has(id)) {
      lemmaForUnknownRevId.push(id);
    }
  }

  // 6. Check lemma.lemmaFor[] and lemma.dependentOn[] IDs
  const missingTargets = {
    lemmaFor: new Map(),    // targetId -> [sourceRevId, ...]
    dependentOn: new Map(), // targetId -> [sourceRevId, ...]
  };

  for (const entry of lemmas) {
    const { revId, lemma } = entry;
    if (!lemma) continue;

    const lemmaFor = Array.isArray(lemma.lemmaFor) ? lemma.lemmaFor : [];
    const dependentOn = Array.isArray(lemma.dependentOn)
      ? lemma.dependentOn
      : [];

    // Check lemmaFor[]
    for (const targetId of lemmaFor) {
      if (!allRevIds.has(targetId)) {
        if (!missingTargets.lemmaFor.has(targetId)) {
          missingTargets.lemmaFor.set(targetId, []);
        }
        missingTargets.lemmaFor.get(targetId).push(revId);
      }
    }

    // Check dependentOn[]
    for (const targetId of dependentOn) {
      if (!allRevIds.has(targetId)) {
        if (!missingTargets.dependentOn.has(targetId)) {
          missingTargets.dependentOn.set(targetId, []);
        }
        missingTargets.dependentOn.get(targetId).push(revId);
      }
    }
  }

  // 7. Report results

  console.log("=== Lemma Sanity Check ===\n");

  console.log(`Total revs:           ${revs.length}`);
  console.log(`Total lemma entries:  ${lemmas.length}\n`);

  // A) revs with no lemma entry
  if (revsMissingLemma.length === 0) {
    console.log("✅ Every rev.id has a corresponding revId in rev.lemmas.json.\n");
  } else {
    console.log("⚠ Revs missing lemma metadata (id exists in revs.json but not as revId):");
    for (const id of revsMissingLemma) {
      console.log(`  • ${id}`);
    }
    console.log();
  }

  // B) lemma entries that don't correspond to any rev in revs.json
  if (lemmaForUnknownRevId.length === 0) {
    console.log("✅ Every revId in rev.lemmas.json exists in revs.json.\n");
  } else {
    console.log("⚠ Lemma entries whose revId does not appear in revs.json:");
    for (const id of lemmaForUnknownRevId) {
      console.log(`  • ${id}`);
    }
    console.log();
  }

  // C) lemmaFor and dependentOn pointing at missing revs
  const { lemmaFor, dependentOn } = missingTargets;

  if (lemmaFor.size === 0 && dependentOn.size === 0) {
    console.log(
      "✅ All lemma.lemmaFor[] and lemma.dependentOn[] IDs point to existing revs.\n"
    );
  } else {
    console.log(
      "⚠ Found lemma relations pointing to revIds that do not exist in revs.json:\n"
    );

    if (lemmaFor.size > 0) {
      console.log("Missing targets in lemma.lemmaFor:\n");
      for (const [targetId, sources] of lemmaFor.entries()) {
        console.log(`  - ${targetId} referenced by lemmaFor of:`);
        for (const src of sources) {
          console.log(`      • ${src}`);
        }
        console.log();
      }
    }

    if (dependentOn.size > 0) {
      console.log("Missing targets in lemma.dependentOn:\n");
      for (const [targetId, sources] of dependentOn.entries()) {
        console.log(`  - ${targetId} referenced by dependentOn of:`);
        for (const src of sources) {
          console.log(`      • ${src}`);
        }
        console.log();
      }
      console.log();
    }
  }

  console.log("=== End Lemma Sanity Check ===");
}

main().catch((err) => {
  console.error("❌ Error during lemma sanity check:", err);
  process.exit(1);
});
