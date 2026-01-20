// src/onboarding/onboardingConfig.ts

export const WORLD_SIZE = 12;

export type CameraPose = {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
};





export const CAMERA_PRESETS: CameraPose[] = [
  { position: { x: 6.8, y: 1.8, z: -4 }, target: { x: 6, y: 9, z: 6 } },   // purpose
  { position: { x: 11, y: -14, z: -6 }, target: { x: 8, y: 4, z: 3 } },     // seed
  { position: { x: -6, y: -14, z: 0 }, target: { x: 4, y: 1, z: 4 } },      // body
  { position: { x: -14, y: 14, z: 10 }, target: { x: 2, y: 8, z: 6 } },     // categories
  { position: { x: 4.8, y: 9.8, z: -11 }, target: { x: 4, y: 9, z: 6 } },   // taxonomy
  { position: { x: -6, y: 10, z: -11 }, target: { x: 5, y: 10, z: 5 } },    // dimensions
  { position: { x: 4.8, y: 11.8, z: -11 }, target: { x: 4, y: 11, z: 4 } }, // families
  { position: { x: 6, y: 12.8, z: -6 }, target: { x: 3, y: 12, z: 3 } },    // subfamilies
  { position: { x: -12, y: 6.8, z: 15 }, target: { x: 4, y: 6, z: 6 } },    // links
  { position: { x: -6, y: 0, z: 18 }, target: { x: 8, y: 6, z: 6 } },       // tags
  { position: { x: -4, y: 6, z: 13 }, target: { x: 12, y: 6, z: 4 } },      // lemmas
  { position: { x: -15, y: -15, z: -15 }, target: { x: 6, y: 6, z: 0 } },   // axiom
  { position: { x: -11, y: -11, z: -11 }, target: { x: 6, y: 6, z: 0 } },   // json
];

export const NODE_CONFIGS = [
  { id: "purpose", label: "Purpose", copy: "Cael is a cognitive ecosystem.", x: 6, y: 6, z: 2, step: 0, cardOffset: { dx: 100, dy: -25 }, color: 0xfdd661,}, // teal 
  { id: "seed", label: "Seed Event", copy: "Users create documents within that ecosystem.", x: 8, y: 3, z: 3, step: 1, cardOffset: { dx: 100, dy: -35 }, color: 0xa2f951, },
  { id: "body", label: "Body", copy: "Documents record insights, discoveries, personal events, or anything worth revisiting.", x: 4, y: 1, z: 4, step: 2, cardOffset: { dx: -360, dy: -100 }, color: 0x5f5aa5, },
  { id: "categories", label: "Categories", copy: "Documents are cross-linked through different relationship types and meanings.", x: 2, y: 8, z: 6, step: 3, cardOffset: { dx: -360, dy: -35}, color: 0xf84631, },
  { id: "taxonomy", label: "Taxonomy", copy: "Documents are categorized using dimensions, families, and subfamilies.", x: 4, y: 9, z: 6, step: 4, cardOffset: { dx: 60, dy: -70 }, color: 0xa866be,  },
  { id: "dimensions", label: "Dimensions", copy: "High-level axes: emotional architecture, recursion logic, etc.", x: 5, y: 10, z: 5, step: 5, cardOffset: { dx: 60, dy: -40 }, color: 0xc3acea,  },
  { id: "families", label: "Families", copy: "Mid-level groupings that cluster related revs.", x: 4, y: 11, z: 4, step: 6, cardOffset: { dx: -360, dy: -60}, color: 0xffc857, },
  { id: "subfamilies", label: "Subfamilies", copy: "Fine-grained categories for precise placement.", x: 3, y: 12, z: 3, step: 7, cardOffset: { dx: -360, dy: -35}, color: 0x9fb98e, },
  { id: "links", label: "Links", copy: "Direct navigation between thoughts—insight isn’t always sequential.", x: 4, y: 6, z: 6, step: 8, cardOffset: { dx: -300, dy: -125 }, color: 0xeeeeee,  },
  { id: "tags", label: "Tags", copy: "Keywords for fast recall and semantic search.", x: 4, y: 6, z: 9, step: 9, cardOffset: { dx: -360, dy: -50 }, color: 0x8aa3ff,  },
  { id: "lemmas", label: "Lemmas", copy: "Some revs aren’t just related—they’re dependencies required for others.", x: 4, y: 7, z: 8, step: 10, cardOffset: { dx: -360, dy: 0 }, color: 0x8aa3ff,  },
  { id: "axiom", label: "Axiom", copy: "A distilled rule-of-thumb derived from purpose + seed + body: the cement of insight.", x: 3, y: 4, z: 6, step: 11, cardOffset: { dx: -300, dy: -120 }, color: 0x8aa3ff,  },
  { id: "json", label: "JSON", copy: "All of these properties in concert create a .rev file -- a recursive event file -- which acts as the atomic unit of insight in the Cael ecosystem", x: 3, y: 4, z: 6, step: 12, cardOffset: { dx: -35, dy: 300 }, color: 0x8aa3ff,  },

] as const;

export type NodeId = (typeof NODE_CONFIGS)[number]["id"];
export type ScreenPoint = { x: number; y: number };
export type ScreenPosMap = Partial<Record<NodeId, ScreenPoint>>;
export type NodeConfig = (typeof NODE_CONFIGS)[number];

export type CaelLinkKind = "line" | "arc";

export type CaelLink = {
  source: NodeId;
  target: NodeId;
  kind?: CaelLinkKind;
};

export const LINKS = [
  { source: "purpose", target: "seed" },
  { source: "seed", target: "body" },
  { source: "body", target: "categories" },
  { source: "categories", target: "taxonomy" },
  { source: "categories", target: "links" },
  { source: "taxonomy", target: "dimensions" },
  { source: "dimensions", target: "families" },
  { source: "families", target: "subfamilies" },

  { source: "taxonomy", target: "dimensions", kind: "arc" },
  { source: "taxonomy", target: "families", kind: "arc" },
  { source: "taxonomy", target: "subfamilies", kind: "arc" },

  { source: "links", target: "tags" },
  { source: "links", target: "lemmas" },

  { source: "purpose", target: "axiom", kind: "arc" },
  { source: "seed", target: "axiom", kind: "arc" },
  { source: "body", target: "axiom", kind: "arc" },
] satisfies CaelLink[];
