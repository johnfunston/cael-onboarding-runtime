import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";


// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env for MONGODB_URI
dotenv.config();

// -- Core RevLinkType mapping --

// Normalized types:

const CORE_TYPES = [
    "axiom",
    "lemma",
    "corollary",
    "prerequisite",
    "supports",
    "validates",
    "governs",
    "parallel",
    "contradicts",
    "informs",
    "related",
];

// Map from raw flavor string -> core type

const TYPE_FLAVOR_MAP = {
    // Proof / logic
    axiom: ["axiom"],
    lemma: ["lemma"],
    corollary: ["corollary"],

    // Dependencies / lineage
    prerequisite: [
        "prerequisite",
        "prerequisite_for",
        "requires",
        "foundation",
        "foundational_precondition",
        "rooted_in",
        "origin",
        "ancestral_root",
        "lineage_root",
        "ancestral_precedent",
        "existential_lineage",
    ],
    
    // Support / construction
    supports: [
        "supports",
        "supported_by",
        "builds_on",
        "extends",
        "generalizes",
        "feeds",
        "contributes_to",
        "utilizes",
        "uses",
        "enabled_by",
        "enables",
        "tightens",
        "integrates",
        "applies_to",
    ],

    // Validation / evidence
    validates: [
        "validates", 
        "validation_of", 
        "evidence", 
        "evaluates_against",
    ],

    // Governance / constraint
    governs: [
        "governs",
        "governed_by",
        "constrains",
        "guarded_by",
        "approved_by",
    ],

    // Similarity / affinity
  parallel: [
    "parallel",
    "resonates_with",
    "aligned_with",
    "aligns_with",
    "mirrors",
    "echoed_in",
    "shares_foundation_with",
    "structural_affinity",
    "conceptual_affinity",
    "civilizational_parallel",
    "co_emergent_with",
    "sibling",
    "civilizational_parallel",
  ],

  // Tension
  contradicts: ["contradicts"],

  // Soft directional influence
  informs: ["informs", "informed_by", "influences"],

  // Everything else soft / broad
  related: [
    "related_to",
    "participates_in",
    "insight_birth",
    "implicit",
    "influenced_by",
    "echoed_in",
    "aims_at",
    "lines_up_with",
  ],
};

// Pre-compute reverse lookup: flavor -> type

const FLAVOR_TO_TYPE = (() => {
    const map = new Map();
    for (const [coreType, flavors] of Object.entries(TYPE_FLAVOR_MAP)) {
        for (const f of flavors) {
            map.set(f, coreType);
        }
    }
    return map;
})();

function getCoreTypeForFlavor(flavor) {
    if (!flavor || typeof flavor !== "string") return "related";
    const normalized = flavor.trim();
    const mapped = FLAVOR_TO_TYPE.get(normalized);
    if (mapped && CORE_TYPES.includes(mapped)) {
        return mapped;
    }
    //if we don't recognize it, treat it as a soft relation
    return "related";
}

// --- Main seeding logic ---

async function main() {
    const uri = process.env.MONGODB_URI;
    if(!uri) {
        throw new Error("MONGODB_URI is not set in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    const db = mongoose.connection;
    console.log("Connected successfully.");

    try {
        //Load revs.json
        const revsPath = path.join(__dirname, "../revs.json");
        const raw = await fs.readFile(revsPath, "utf-8");
        const revs = JSON.parse(raw);

        if(!Array.isArray(revs)) {
            throw new Error("revs.json must be a top-level JSON array.");
        }
        console.log(`Loaded ${revs.length} revs from revs.json`);

        // Normalize links: add flavor, compute core type
        const normalizedRevs = revs.map((rev) => {
            const links = Array.isArray(rev.links) ? rev.links : [];
            const normalizedLinks = links.map((link) => {
                const originalFlavor = link.type // Flavor types were originally placed in the types property.
                const coreType = getCoreTypeForFlavor(originalFlavor);

                return {
                    ...link,
                    flavor: originalFlavor,
                    type: coreType,
                };
            });

            return {
                ...rev,
                links: normalizedLinks,
            };
        });
        // Purge existing collection
        const collection = db.collection("revs");
        console.log("Purging existing revs collection...");
        await collection.deleteMany({});
        console.log("Collection purged.")
        
        // Insert normalized revs
        console.log("Inserting normalized revs...");
        const result = await collection.insertMany(normalizedRevs);
        console.log(`Inserted ${result.insertedCount} rev documents.`);
    } finally {
        console.log("Closing MongoDB connection.");
        await mongoose.disconnect();
    }
}

main().catch((err) => {
    console.error("Error during seeding:", err);
    process.exit(1);
});