export type RevLinkType =
  | "axiom"               // foundational truth this rev depends on
  | "lemma"               // supporting prerequisite insight
  | "corollary"           // consequence or follow-through
  | "prerequisite"        // structural dependency, not strictly lemma
  | "supports"            // strengthens, extends, contributes to
  | "validates"           // evidence, evaluation, justification
  | "governs"             // constrains, sets rules for, shapes behavior
  | "parallel"            // conceptual or structural similarity
  | "contradicts"         // challenges or opposes
  | "informs"             // soft influence, directional but weak
  | "related";            // fallback bucket for anything broad or soft

export interface RevLink {
  targetId: string;
  type: RevLinkType;
  flavor?: string;
  note?: string;
  confidence?: number;
}

export type RevStatus = "draft" | "active" | "integrated" | "archived" | "emerging" | "complete";

export interface RevLemmaMetaData {
  isLemma: boolean;
  roles: string[];
  lemmaFor: string[];
  dependentOn: string[];
  confidence?: number,
}

export interface RevMetadata {
  activation?: {
    current: number;
    lastUpdated: string | null;
    decayRate?: number;
  };
  confidence?: number;
  hyperedges?: string[][];
  lineageRank?: number;
  taxonomy?: {
  families?: string[];
  subfamilies?: string[];
  subfamilyWeights?: Record<string, number>;
  dimensions?: string[];
  dimensionWeights?: Record<string, number>;
  }
  lemma?: RevLemmaMetaData;
  [key: string]: unknown;
}

export interface Rev {
  id: string;
  title: string;
  userId: string;
  status: RevStatus;
  version: string;
  createdAt: string;
  updatedAt: string | null;

  seedEvent?: string;
  purpose?: string;
  body: string;
  axiom?: string;

  archetypes?: string[];
  tags?: string[];

  links: RevLink[];

  embedding?: number[];
  graphEmbedding?: number[];
  fusedEmbedding?: number[];

  history: RevHistoryEntry[];

  metadata?: RevMetadata;
}

export type RevSnapshot = Omit<Rev, "history">;

export interface RevHistoryEntry {
  version: string;
  timestamp: string;
  summary: string;
  snapshot: RevSnapshot;
}
