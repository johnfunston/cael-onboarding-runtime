// scripts/exportRevsToBackup.ts
import fs from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import mongoose from "mongoose";
import { RevModel } from "../models/rev.model";
import type { Rev, RevMetadata } from "../types/rev.types";

type BackupShape = {
  revs: Rev[];
};

const BACKUP_PATH = path.resolve(process.cwd(), "rev-backup-db.json");

type MongoInternals = {
  _id?: unknown;
  __v?: unknown;
};

type TaxonomyWeights = Record<string, number> | Map<string, number> | undefined;

type RevWithMongoInternals = Rev & MongoInternals;

function isMapStringNumber(value: unknown): value is Map<string, number> {
  return value instanceof Map;
}

function mapToRecord(value: TaxonomyWeights): Record<string, number> | undefined {
  if (!value) return undefined;
  if (isMapStringNumber(value)) {
    const out: Record<string, number> = {};
    for (const [k, v] of value.entries()) out[k] = v;
    return out;
  }
  // already a plain object record
  return value;
}

/**
 * Ensure JSON-safe, schema-faithful output:
 * - remove mongo internals
 * - convert Mongoose Map weights to plain objects
 */
function normalizeRev(doc: RevWithMongoInternals): Rev {
  const { _id, __v, ...rev } = doc;
  void _id
  void __v

  const metadata: RevMetadata | undefined = rev.metadata;
  const taxonomy = metadata?.taxonomy;

  if (!metadata || !taxonomy) {
    return rev;
  }

  const normalizedMetadata: RevMetadata = {
    ...metadata,
    taxonomy: {
      ...taxonomy,
      dimensionWeights: mapToRecord(taxonomy.dimensionWeights),
      subfamilyWeights: mapToRecord(taxonomy.subfamilyWeights),
    },
  };

  return {
    ...rev,
    metadata: normalizedMetadata,
  };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in env");
  }

  await mongoose.connect(mongoUri);

  // NOTE: lean() returns plain objects (not hydrated docs) which is ideal for backup.
  // We type it as (Rev & MongoInternals)[] because _id/__v can still appear.
  const docs = (await RevModel.find({})
    .sort({ createdAt: 1 })
    .lean()) as RevWithMongoInternals[];

  const revs: Rev[] = docs.map(normalizeRev);

  const bundle: BackupShape = { revs };

  await fs.writeFile(BACKUP_PATH, JSON.stringify(bundle, null, 2), "utf-8");

  console.log(`✅ Wrote ${revs.length} rev(s) → ${path.basename(BACKUP_PATH)}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("❌ Export failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
