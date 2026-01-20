// src/lib/graphTypes.ts
import type { Rev, RevLinkType } from "./revTypes";
import { dimensionColorMap } from "../styles/dimensionColorMap";

export type GraphNode = {
  id: string;           // rev.id
  label: string;        // truncated title
  dimension?: string;   // first taxonomy dimension
  lineageRank?: number; // metadata.lineageRank
  activation?: number;  // metadata.activation?.current
  degree?: number;      // filled in after we build links
  dimensionWeights?: Record<string, number>;
  color?: string;
};

export type GraphLink = {
  source: string;        // rev.id
  target: string;        // link.targetId
  type: RevLinkType;     // lemma | corollary | informs | ...
  confidence?: number;   // link.confidence
};

export type FGNode = GraphNode & {
  x: number;
  y: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};

/**
 * Build a graph model (nodes + links) from a list of revs.
 * - Only keeps links where both source + target rev exist.
 * - Optionally dedupes symmetric links (A->B and B->A).
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function computeNodeColorFromWeights(
  weights: Record<string, number> | undefined
): string {
  if (!weights || Object.keys(weights).length === 0) {
    return "#999999"; // fallback neutral
  }

  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return "#999999";

  let rAcc = 0;
  let gAcc = 0;
  let bAcc = 0;

  for (const [dimensionId, weight] of entries) {
    const baseHex = dimensionColorMap[dimensionId];
    if (!baseHex) continue;

    const { r, g, b } = hexToRgb(baseHex);
    const wNorm = weight / total;

    rAcc += r * wNorm;
    gAcc += g * wNorm;
    bAcc += b * wNorm;
  }

  const r = Math.round(Math.min(255, Math.max(0, rAcc)));
  const g = Math.round(Math.min(255, Math.max(0, gAcc)));
  const b = Math.round(Math.min(255, Math.max(0, bAcc)));

  return rgbToHex(r, g, b);
}

// If you still want a single "primary" dimension for labels:
function getPrimaryDimension(
  dimensions: string[] | undefined,
  weights: Record<string, number> | undefined
): string | undefined {
  if (!dimensions || dimensions.length === 0) return undefined;
  if (!weights) return dimensions[0];

  let bestDim = dimensions[0];
  let bestWeight = -Infinity;

  for (const dim of dimensions) {
    const w = weights[dim];
    if (w !== undefined && w > bestWeight) {
      bestWeight = w;
      bestDim = dim;
    }
  }

  return bestDim;
}

export function buildGraphFromRevs(
  revs: Rev[],
  options?: { dedupeUndirected?: boolean }
): { nodes: GraphNode[]; links: GraphLink[] } {
  const { dedupeUndirected = true } = options ?? {};

  // Quick lookup: id -> Rev
  const revById = new Map<string, Rev>();
  revs.forEach((rev) => revById.set(rev.id, rev));

  // ---- 1. Build nodes ----
  const nodes: GraphNode[] = revs.map((rev) => {
    const taxonomy = rev.metadata?.taxonomy;
    const dimensions = taxonomy?.dimensions;
    const dimensionWeights = taxonomy?.dimensionWeights;

    const primaryDimension = getPrimaryDimension(dimensions, dimensionWeights);
    const blendedColor = computeNodeColorFromWeights(dimensionWeights);

    return {
      id: rev.id,
      label: truncateTitle(rev.title),
      dimension: primaryDimension,
      dimensionWeights, // keep full weight map for later if needed
      lineageRank: rev.metadata?.lineageRank,
      activation: rev.metadata?.activation?.current,
      degree: 0, // we'll fill this later
      color: blendedColor,
    };
  });

  // Node degree accumulator
  const degreeCount = new Map<string, number>();
  nodes.forEach((node) => degreeCount.set(node.id, 0));

  // ---- 2. Build links ----
  const links: GraphLink[] = [];
  const seenPairs = new Set<string>(); // for undirected dedupe

  for (const rev of revs) {
    if (!rev.links) continue;

    for (const link of rev.links) {
      const sourceId = rev.id;
      const targetId = link.targetId;

      // Skip edges to missing targets
      if (!revById.has(targetId)) continue;

      if (dedupeUndirected) {
        // Treat A-B and B-A as the same pair for visualization
        const [a, b] =
          sourceId < targetId ? [sourceId, targetId] : [targetId, sourceId];

        const key = `${a}__${b}__${link.type}`;
        if (seenPairs.has(key)) {
          continue;
        }
        seenPairs.add(key);
      }

      links.push({
        source: sourceId,
        target: targetId,
        type: link.type,
        confidence: link.confidence,
      });

      // Increment degree for both ends (undirected degree)
      degreeCount.set(sourceId, (degreeCount.get(sourceId) ?? 0) + 1);
      degreeCount.set(targetId, (degreeCount.get(targetId) ?? 0) + 1);
    }
  }

  // ---- 3. Attach degree back to nodes ----
  const nodesWithDegree = nodes.map((node) => ({
    ...node,
    degree: degreeCount.get(node.id) ?? 0,
  }));

  return { nodes: nodesWithDegree, links };
}

// Helper: keep labels readable in the graph
function truncateTitle(title: string, maxLength = 40): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 1) + "…";
}

