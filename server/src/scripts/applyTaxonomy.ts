// server/src/scripts/applyTaxonomy.ts
import dotenv from 'dotenv';
import { connectToDatabase } from '../config/db';
import { RevModel, RevDocument } from '../models/rev.model';
import { computeTaxonomyForFamilies } from '../utils/taxonomy';
import type { RevMetadata } from '../types/rev.types';

dotenv.config({path: __dirname + '/../.env' });

/**
 * Small helper to safely narrow unknown metadata into RevMetadata.
 */
function asRevMetadata(value: unknown): RevMetadata {
  // If it's null/undefined, just return an empty object that satisfies RevMetadata.
  if (value == null || typeof value !== 'object') {
    return {};
  }
  // We know our own structure; this is a safe, typed view over that object.
  return value as RevMetadata;
}

async function main(): Promise<void> {
  await connectToDatabase();
  console.log('[taxonomy] Connected to MongoDB');

  const cursor = RevModel.find().cursor();

  let processed = 0;
  let skippedNoFamilies = 0;

  for await (const doc of cursor) {
    const rev = doc as RevDocument;

    const meta = asRevMetadata(rev.metadata);
    const rawFamilies =
      Array.isArray(meta.families) && meta.families.length > 0
        ? meta.families
        : [];

    if (rawFamilies.length === 0) {
      skippedNoFamilies += 1;
      continue;
    }

    // Compute the taxonomy object from existing families
    const taxonomy = computeTaxonomyForFamilies(rawFamilies);

    // Attach taxonomy and remove the old top-level metadata.families
    const updatedMeta: RevMetadata = {
      ...meta,
      taxonomy: {
        ...taxonomy,
        // optionally also preserve the raw families here:
        families: rawFamilies,
      },
    };

    // Remove old metadata.families so we don't have two sources of truth
    // Typescript doesn’t know about the index signature, so we cast just for delete.
    delete (updatedMeta as { families?: string[] }).families;

    rev.metadata = updatedMeta;

    await rev.save();
    processed += 1;

    if (processed % 25 === 0) {
      console.log(`[taxonomy] Updated ${processed} revs so far…`);
    }
  }

  console.log(`[taxonomy] Done.`);
  console.log(`[taxonomy] Updated revs: ${processed}`);
  console.log(`[taxonomy] Skipped (no families): ${skippedNoFamilies}`);
}

// Run the script
main().catch((err) => {
  console.error('❌ Error applying taxonomy to revs:', err);
  process.exit(1);
});
