// server/src/utils/taxonomy.ts
import type { RevMetadata } from '../types/rev.types';
import {
  SUBFAMILY_CONFIG,
  FAMILY_TO_SUBFAMILY,
  type SubfamilyId,
} from '../ontologies/taxonomy';

type Taxonomy = NonNullable<RevMetadata['taxonomy']>;

/**
 * Normalize a map of weights so they sum to 1 (or return {} if empty / zero).
 */
export function normalizeWeights(
  weights: Record<string, number>
): Record<string, number> {
  const entries = Object.entries(weights).filter(([, v]) => v > 0);
  if (entries.length === 0) return {};

  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total <= 0) return {};

  const normalized: Record<string, number> = {};
  for (const [key, value] of entries) {
    normalized[key] = value / total;
  }
  return normalized;
}

/**
 * Compute taxonomy object for a given list of raw family strings.
 */
export function computeTaxonomyForFamilies(families: string[]): Taxonomy {
  // Defensive copy + de-dup
  const uniqueFamilies = Array.from(new Set(families || []));

  // 1) Map families → subfamilies and count occurrences
  const subfamilyCounts: Record<string, number> = {};
  const unmappedFamilies: string[] = [];

  for (const family of uniqueFamilies) {
    const subfamilyId = FAMILY_TO_SUBFAMILY[family];
    if (!subfamilyId) {
      unmappedFamilies.push(family);
      continue;
    }
    subfamilyCounts[subfamilyId] = (subfamilyCounts[subfamilyId] || 0) + 1;
  }

  if (unmappedFamilies.length > 0) {
    console.warn(
      '[taxonomy] Unmapped families encountered:',
      unmappedFamilies
    );
  }

  const totalMappedFamilies = Object.values(subfamilyCounts).reduce(
    (sum, c) => sum + c,
    0
  );

  // If nothing mapped, return a minimal taxonomy object
  if (totalMappedFamilies === 0) {
    return {
      families: uniqueFamilies,
      subfamilies: [],
      subfamilyWeights: {},
      dimensions: [],
      dimensionWeights: {},
    };
  }

  // 2) Compute subfamily weights (counts / totalMappedFamilies)
  const rawSubfamilyWeights: Record<string, number> = {};
  for (const [subId, count] of Object.entries(subfamilyCounts)) {
    rawSubfamilyWeights[subId] = count / totalMappedFamilies;
  }
  const subfamilyWeights = normalizeWeights(rawSubfamilyWeights);

  const subfamilies = Object.keys(subfamilyWeights);

  // 3) Derive dimensions and weights by summing subfamily weights per dimension
  const rawDimensionWeights: Record<string, number> = {};

  for (const [subId, weight] of Object.entries(subfamilyWeights)) {
    const config = SUBFAMILY_CONFIG[subId as SubfamilyId];
    if (!config) continue;
    const dimId = config.dimensionId;
    rawDimensionWeights[dimId] = (rawDimensionWeights[dimId] || 0) + weight;
  }

  const dimensionWeights = normalizeWeights(rawDimensionWeights);
  const dimensions = Object.keys(dimensionWeights);

  return {
    families: uniqueFamilies,
    subfamilies,
    subfamilyWeights,
    dimensions,
    dimensionWeights,
  };
}
