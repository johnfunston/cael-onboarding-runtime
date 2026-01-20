export type RevSummary = {
    id: string;
    title: string;
};

export type RevLinkType =
  | "axiom"
  | "lemma"
  | "corollary"
  | "prerequisite"
  | "supports"
  | "validates"
  | "governs"
  | "parallel"
  | "contradicts"
  | "informs"
  | "related";

export type RevLink = {
  targetId: string;
  type: RevLinkType;
  flavor?: string;
  note?: string;
  confidence?: number;
};

export type RevLemmaMetadata = {
  isLemma: boolean;
  roles: string[];
  lemmaFor: string[];
  dependentOn: string[];
  confidence?: number;
};

export type RevMetadata = {
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
  };
  lemma?: RevLemmaMetadata;
  // keep it loose for future fields
  [key: string]: unknown;
};

export type Rev = {
    id: string;
    title: string;
    status: string;
    version: string;
    createdAt: string;
    updatedAt: string | null;
    seedEvent?: string;
    purpose?: string;
    body: string;
    axiom?: string;
    archetypes?: string[];
    tags?: string[];
    metadata?: RevMetadata;
    links?: RevLink[];
}
