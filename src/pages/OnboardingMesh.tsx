// 1) src/pages/OnboardingMesh.tsx
// Add a visibleNodeIds Set derived from enabledDimensions + searchText,
// and ALWAYS include activeNodeId (Option A).
// Then pass visibleNodeIds to the graph.

import React, { useMemo, useState, useRef } from "react";
import onboardingRevsRaw from "../data/onboarding-revs.json";
import OnboardingMesh2dGraph from "../components/OnboardingMesh2dGraph";
import OnboardingMeshRevPanel from "../components/OnboardingMeshRevPanel";
import OnboardingMeshRevList from "../components/OnboardingMeshRevList";
import LogoButton from "../components/LogoButton";
import OnboardingMeshTraversalPanel from "../components/OnboardingMeshTraversalPanel";
import OnboardingMesh3dGraph from '../components/OnboardingMesh3dGraph';
import ViewsToggleButton, { type DimensionalView } from "../components/ViewsToggleButton";


import GENESIS_ICON from "/assets/genesis-icon.png";
import PROBLEM_ICON from "/assets/problem-icon.png";
import PROPOSAL_ICON from "/assets/proposal-icon.png";
import MECHANISM_ICON from "/assets/mechanism-icon.png";
import TEMPORAL_EVOLUTION_ICON from "/assets/temporal-evolution-icon.png";
import NAVIGATION_UI_ICON from "/assets/navigation-ui-icon.png";
import ANALYTICS_ENGINE_ICON from "/assets/analytics-engine-icon.png";
import CLASSIFICATION_LAYER_ICON from "/assets/classification-layer-icon.png";
import GRAPH_STRUCTURE_ICON from "/assets/graph-structure-icon.png";
import SEMANTIC_VECTOR_ICON from "/assets/semantic-vector-icon.png";
import RUNTIME_ARCHITECTURE_ICON from "/assets/runtime-architecture-icon.png";

type RevId = string;
type LineageRank = number;

type RevLink = {
  targetId: RevId;
  type: string;
  note?: string;
  confidence?: number;
};

type RevMetadata = {
  lineageRank: LineageRank;
  confidence?: number;
  hyperedges?: unknown[];
};

type OnboardingRev = {
  id: RevId;
  title?: string;
  userId?: string;
  status?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;

  seedEvent?: string;
  purpose?: string;
  body?: string;
  axiom?: string;

  archetypes?: string[];
  tags?: string[];

  links?: RevLink[];

  embedding?: unknown[];
  graphEmbedding?: unknown[];
  fusedEmbedding?: unknown[];

  history?: unknown[];

  metadata: RevMetadata;

  [key: string]: unknown;
};

function isOnboardingRevArray(value: unknown): value is OnboardingRev[] {
  if (!Array.isArray(value)) return false;

  return value.every((v) => {
    if (typeof v !== "object" || v === null) return false;
    const obj = v as Record<string, unknown>;
    return (
      typeof obj.id === "string" &&
      typeof obj.metadata === "object" &&
      obj.metadata !== null &&
      typeof (obj.metadata as Record<string, unknown>).lineageRank === "number"
    );
  });
}

export type DimensionKey =
  | "GENESIS"
  | "PROBLEM"
  | "PROPOSAL"
  | "MECHANISM"
  | "TEMPORAL_EVOLUTION"
  | "NAVIGATION_UI"
  | "ANALYTICS_ENGINE"
  | "CLASSIFICATION_LAYER"
  | "GRAPH_STRUCTURE"
  | "SEMANTIC_VECTOR"
  | "RUNTIME_ARCHITECTURE";

const ALL_DIMENSIONS: DimensionKey[] = [
  "GENESIS",
  "PROBLEM",
  "PROPOSAL",
  "MECHANISM",
  "TEMPORAL_EVOLUTION",
  "NAVIGATION_UI",
  "ANALYTICS_ENGINE",
  "CLASSIFICATION_LAYER",
  "GRAPH_STRUCTURE",
  "SEMANTIC_VECTOR",
  "RUNTIME_ARCHITECTURE",
];

// -------------------------
// Dimensions (IDs)
// -------------------------

const GENESIS: RevId[] = ["genesis.rev"];

const PROBLEM: RevId[] = [
  "unstructured.insight.rev",
  "semantic.ambiguity.rev",
  "implicit.dependency.chains.rev",
  "non.linear.knowledge.evolution.rev",
  "navigating.large.knowledge.graphs.rev",
  "categorization.without.rigidity.rev",
  "measuring.conceptual.relatedness.rev",
  "structural.pattern.detection.rev",
  "temporal.context.preservation.rev",
  "coordinating.multiple.reasoning.modes.rev",
  "evaluation.criteria.for.knowledge.operations.rev",
  "externalizing.cognitive.architecture.rev",
];

const PROPOSAL: RevId[] = [
  "atomic.insight.objects.rev",
  "structured.fields.rev",
  "links.between.insights.rev",
  "lemma.dependency.mapping.rev",
  "insight.taxonomy.classification.rev",
  "tagging.and.keyword.semantics.rev",
  "lineage.of.evolving.ideas.rev",
  "graph.representations.of.knowledge.rev",
  "interactive.knowledge.navigation.rev",
  "semantic.embeddings.rev",
  "graph.structure.analysis.rev",
  "personal.to.public.cognitive.platform.rev",
];

const MECHANISM: RevId[] = [
  "rev.canonical.form.architecture.rev",
  "structured.rev.fields.rev",
  "rev.schema.contract.rev",
  "seed.event.model.rev",
  "axiom.extraction.rev",
  "archetype.assignment.logic.rev",
  "metadata.activation.model.rev",
  "rev.identity.persistence.rev",
  "history.suppression.protocol.rev",
  "links.object.model.rev",
  "lemma.architecture.rev",
  "mesh.topology.rules.rev",
  "rev.link.inference.rev",
];

const TEMPORAL_EVOLUTION: RevId[] = [
  "rev.genealogy.index.rev",
  "rev.versioning.protocol.rev",
  "idea.refinement.chain.rev",
  "temporal.mesh.coherence.rev",
  "rev.genealogy.index.revisited.rev",
];

const NAVIGATION_UI: RevId[] = [
  "dependency.traversal.logic.rev",
  "mesh.traversal.protocol.rev",
  "runtime.flow.controller.rev",
  "session.state.engine.rev",
  "ui.graph.interaction.rev",
];

const ANALYTICS_ENGINE: RevId[] = [
  "lemma.dependency.graph.rev",
  "lineageRank.calculation.rev",
  "graph.analytics.engine.rev",
  "glyph.constellation.rev",
  "mesh.depth.pruning.rev",
  "gifted.edge.weight.rev",
];

const CLASSIFICATION_LAYER: RevId[] = [
  "dimension.family.taxonomy.rev",
  "taxonomy.assignment.rules.rev",
  "taxonomy.navigation.ui.rev",
  "tag.semantic.layer.rev",
  "search.filter.engine.rev",
  "keyword.embedding.bridge.rev",
];

const GRAPH_STRUCTURE: RevId[] = [
  "graph.node.edge.model.rev",
  "node.gravity.rev",
  "graph.layout.engine.rev",
];

const SEMANTIC_VECTOR: RevId[] = [
  "embedding.mesh.rev",
  "fusion.embedding.rev",
  "coherence.vector.space.rev",
  "semantic.retrieval.logic.rev",
  "semantic.retrieval.logic.rev",
];

const RUNTIME_ARCHITECTURE: RevId[] = [
  "symbolic.runtime.rev",
  "multi.agentic.framework.rev",
  "neural.handshake.rev",
  "symbolic.runtime.compiler.rev",
  "coherence.loss.function.rev",
  "coherence.attractor.state.rev",
];

const iconSrcByDimension: Partial<Record<DimensionKey, string>> = {
  GENESIS: GENESIS_ICON,
  PROBLEM: PROBLEM_ICON,
  PROPOSAL: PROPOSAL_ICON,
  MECHANISM: MECHANISM_ICON,
  TEMPORAL_EVOLUTION: TEMPORAL_EVOLUTION_ICON,
  NAVIGATION_UI: NAVIGATION_UI_ICON,
  ANALYTICS_ENGINE: ANALYTICS_ENGINE_ICON,
  CLASSIFICATION_LAYER: CLASSIFICATION_LAYER_ICON,
  GRAPH_STRUCTURE: GRAPH_STRUCTURE_ICON,
  SEMANTIC_VECTOR: SEMANTIC_VECTOR_ICON,
  RUNTIME_ARCHITECTURE: RUNTIME_ARCHITECTURE_ICON,
};

//Normalize strings
function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// -------------------------
// Branches (lineageRank order)
// -------------------------
const BRANCH_0: LineageRank[] = [1];
const BRANCH_1: LineageRank[] = [2, 3, 4, 5, 6, 7, 8];
const BRANCH_2: LineageRank[] = [9, 10, 11, 12, 13, 14, 15];
const BRANCH_3: LineageRank[] = [16, 17, 18, 19, 20, 21];
const BRANCH_4: LineageRank[] = [22, 23, 24, 25, 26, 27];
const BRANCH_5: LineageRank[] = [28, 29, 30, 31, 32];
const BRANCH_6: LineageRank[] = [33, 34, 35, 36, 37];
const BRANCH_7: LineageRank[] = [38, 39, 40, 41, 42];
const BRANCH_8: LineageRank[] = [43, 44, 45, 46, 47];
const BRANCH_9: LineageRank[] = [48, 49, 50, 51, 52, 53];
const BRANCH_10: LineageRank[] = [54, 55, 56, 57, 58, 59];
const BRANCH_11: LineageRank[] = [60, 61, 62, 63, 64, 65];
const BRANCH_12: LineageRank[] = [66, 67, 68, 69, 70, 71, 72, 73];

const BRANCHES = {
  BRANCH_0,
  BRANCH_1,
  BRANCH_2,
  BRANCH_3,
  BRANCH_4,
  BRANCH_5,
  BRANCH_6,
  BRANCH_7,
  BRANCH_8,
  BRANCH_9,
  BRANCH_10,
  BRANCH_11,
  BRANCH_12,
} as const;

type BranchId = keyof typeof BRANCHES;

function buildTraversalSequence(branches: typeof BRANCHES): LineageRank[] {
  const orderedBranchIds: BranchId[] = [
    "BRANCH_0",
    "BRANCH_1",
    "BRANCH_2",
    "BRANCH_3",
    "BRANCH_4",
    "BRANCH_5",
    "BRANCH_6",
    "BRANCH_7",
    "BRANCH_8",
    "BRANCH_9",
    "BRANCH_10",
    "BRANCH_11",
    "BRANCH_12",
  ];

  const result: LineageRank[] = [];
  for (const id of orderedBranchIds) result.push(...branches[id]);
  return result;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function resolveRevVersionForRank(
  rev: OnboardingRev | null,
  lineageRank: LineageRank | null
): OnboardingRev | null {
  if (!rev || lineageRank === null) return rev;

  if (rev.metadata?.lineageRank === lineageRank) return rev;

  const history = Array.isArray(rev.history) ? (rev.history as unknown[]) : [];
  for (const entry of history) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const meta = e.metadata as Record<string, unknown> | undefined;
    const rank = meta?.lineageRank;
    if (typeof rank === "number" && rank === lineageRank) {
      return entry as OnboardingRev;
    }
  }

  return rev;
}

const OnboardingMesh: React.FC = () => {
  const revs: OnboardingRev[] = useMemo(() => {
    const raw: unknown = onboardingRevsRaw;
    if (!isOnboardingRevArray(raw)) return [];
    return raw;
  }, []);

  const traversalSequence = useMemo(() => buildTraversalSequence(BRANCHES), []);
  const maxStep = Math.max(0, traversalSequence.length - 1);

  const revById = useMemo(() => {
    const map = new Map<RevId, OnboardingRev>();
    for (const r of revs) map.set(r.id, r);
    return map;
  }, [revs]);

  const revIdByRank = useMemo(() => {
    const map = new Map<LineageRank, RevId>();
    for (const r of revs) map.set(r.metadata.lineageRank, r.id);
    return map;
  }, [revs]);

  const rankByRevId = useMemo(() => {
  const map = new Map<RevId, LineageRank>();
  for (const r of revs) map.set(r.id, r.metadata.lineageRank);
  return map;
}, [revs]);

  const dimensionById = useMemo(() => {
    const map = new Map<RevId, DimensionKey>();

    for (const id of GENESIS) map.set(id, "GENESIS");
    for (const id of PROBLEM) map.set(id, "PROBLEM");
    for (const id of PROPOSAL) map.set(id, "PROPOSAL");
    for (const id of MECHANISM) map.set(id, "MECHANISM");
    for (const id of TEMPORAL_EVOLUTION) map.set(id, "TEMPORAL_EVOLUTION");
    for (const id of NAVIGATION_UI) map.set(id, "NAVIGATION_UI");
    for (const id of ANALYTICS_ENGINE) map.set(id, "ANALYTICS_ENGINE");
    for (const id of CLASSIFICATION_LAYER) map.set(id, "CLASSIFICATION_LAYER");
    for (const id of GRAPH_STRUCTURE) map.set(id, "GRAPH_STRUCTURE");
    for (const id of SEMANTIC_VECTOR) map.set(id, "SEMANTIC_VECTOR");
    for (const id of RUNTIME_ARCHITECTURE) map.set(id, "RUNTIME_ARCHITECTURE");

    return map;
  }, []);

  const [sequentialTraversalStep, setSequentialTraversalStep] = useState<number>(() =>
    clamp(0, 0, maxStep)
  );

  const [activeNodeId, setActiveNodeId] = useState<RevId>("genesis.rev");
  const [hoveredNodeId, setHoveredNodeId] = useState<RevId | null>(null);
  const [visitedStack, setVisitedStack] = useState<RevId[]>([]);
    const isBackNavRef = useRef(false);

  // Filter/search state (RevList + Graph)
  const [enabledDimensions, setEnabledDimensions] = useState<Set<DimensionKey>>(
    () => new Set(ALL_DIMENSIONS)
  );
  const [searchText, setSearchText] = useState<string>("");

  const toggleDimension = (k: DimensionKey): void => {
    setEnabledDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      if (next.size === 0) return prev; // prevent all-off
      return next;
    });
  };

 // -------------------------
// Derived guided rank for current step (your sequential-guided position)
// -------------------------

const activeLineageRank: LineageRank | null =
  traversalSequence[sequentialTraversalStep] ?? null;

const guidedNextId = useMemo<RevId | null>(() => {
  const nextRank = traversalSequence[sequentialTraversalStep + 1] ?? null;
  if (nextRank === null) return null;
  return revIdByRank.get(nextRank) ?? null;
}, [sequentialTraversalStep, traversalSequence, revIdByRank]);

// -------------------------
// Single selection entrypoint:
// - Always sets activeNodeId
// - Pushes history unless we're doing a back-nav pop
// - Only adjusts sequentialTraversalStep if selecting guided prev/next
// -------------------------
const [currentView, setCurrentView] = useState<DimensionalView>("2d");

const handleChangeView = (view: DimensionalView): void => {
  setCurrentView(view);
  setHoveredNodeId(null);
};

const clearSelection = (): void => {
  setActiveNodeId("genesis.rev");
  setSequentialTraversalStep(0);
  setHoveredNodeId(null);
};

const handleSelect = (id: RevId): void => {
  if (id === activeNodeId) return;


  // history push (only for user/forward selections, not for "Prev" pop)
  if (!isBackNavRef.current) {
    const fromId = activeNodeId;
    setVisitedStack((stack) => {
      if (!fromId) return stack;
      if (stack.length > 0 && stack[stack.length - 1] === fromId) return stack;
      return [...stack, fromId];
    });
  }

  setSequentialTraversalStep((s) => {
    const prevRank = traversalSequence[s - 1] ?? null;
    const nextRank = traversalSequence[s + 1] ?? null;

    const prevId =
      prevRank !== null ? revIdByRank.get(prevRank) ?? null : null;
    const nextId =
      nextRank !== null ? revIdByRank.get(nextRank) ?? null : null;

    if (nextId && id === nextId) return clamp(s + 1, 0, maxStep);
    if (prevId && id === prevId) return clamp(s - 1, 0, maxStep);

    return s;
  });

  setActiveNodeId(id);
};

// -------------------------
// Button gating + handlers (new semantics)
// -------------------------

// Prev is HISTORY-based (stack), not sequential
const canPrev = visitedStack.length > 0;

const onPrev = (): void => {
  if (!canPrev) return;

  setVisitedStack((stack) => {
    if (stack.length === 0) return stack;

    const prevId = stack[stack.length - 1];
    const nextStack = stack.slice(0, -1);

    isBackNavRef.current = true;
    setActiveNodeId(prevId);

    queueMicrotask(() => {
      isBackNavRef.current = false;
    });

    return nextStack;
  });
};

// Next (sequential / guided)
const canNextSequential =
  sequentialTraversalStep < maxStep && guidedNextId !== null;

const onNextSequential = (): void => {
  if (!canNextSequential || !guidedNextId) return;
  handleSelect(guidedNextId);
};

// Next (by lineageRank = active lineageRank + 1)
const canNextByRank = useMemo(() => {
  const r = rankByRevId.get(activeNodeId);
  if (typeof r !== "number") return false;
  const nextId = revIdByRank.get(r + 1) ?? null;
  return nextId !== null;
}, [activeNodeId, rankByRevId, revIdByRank]);

const onNextByRank = (): void => {
  const r = rankByRevId.get(activeNodeId);
  if (typeof r !== "number") return;

  const nextId = revIdByRank.get(r + 1) ?? null;
  if (!nextId) return;

  handleSelect(nextId);
};

// (Optional) if you still want a sequential "Prev" button separate from history,
// keep these two lines and wire to a different button:
// const canPrevSequential = sequentialTraversalStep > 0 && guidedPrevId !== null;
// const onPrevSequential = (): void => { if (!canPrevSequential || !guidedPrevId) return; handleSelect(guidedPrevId); };


  const activeRevBase: OnboardingRev | null = revById.get(activeNodeId) ?? null;
  const activeRev: OnboardingRev | null = useMemo(() => {
    return resolveRevVersionForRank(activeRevBase, activeLineageRank);
  }, [activeRevBase, activeLineageRank]);

  // ✅ Visible node ids for Graph (Option A: always include active)
  const visibleNodeIds = useMemo(() => {
    const q = normalize(searchText);
    const set = new Set<RevId>();

    for (const r of revs) {
      const dim = dimensionById.get(r.id);
      if (!dim) continue;
      if (!enabledDimensions.has(dim)) continue;

      if (q.length > 0) {
        const title = r.title ?? r.id;
        const hay = normalize(`${title} ${r.id}`);
        if (!hay.includes(q)) continue;
      }

      set.add(r.id);
    }

    // Option A: never hide the active node
    set.add(activeNodeId);

    return set;
  }, [revs, dimensionById, enabledDimensions, searchText, activeNodeId]);

  // Grouped list data (reuses same predicate)
  const revListGroups = useMemo(() => {
    const q = normalize(searchText);

    const items = revs.map((r) => {
      const dimension = dimensionById.get(r.id) ?? "PROBLEM";
      const title = r.title ?? r.id;

      return {
        id: r.id,
        title,
        dimension,
        lineageRank: r.metadata.lineageRank,
        _search: normalize(`${title} ${r.id}`),
      };
    });

    const filteredByDim = items.filter((it) => enabledDimensions.has(it.dimension));

    const filteredBySearch =
      q.length > 0
        ? filteredByDim.filter((it) => it._search.includes(q))
        : filteredByDim;

    const byDim = new Map<DimensionKey, typeof filteredBySearch>();
    for (const it of filteredBySearch) {
      const arr = byDim.get(it.dimension) ?? [];
      arr.push(it);
      byDim.set(it.dimension, arr);
    }

    return ALL_DIMENSIONS.filter((d) => byDim.has(d)).map((d) => {
      const arr = byDim.get(d)!;
      arr.sort((a, b) => a.lineageRank - b.lineageRank);

      return {
        dimension: d,
        items: arr.map(({ _search, ...rest }) => rest),
      };
    });
  }, [revs, dimensionById, enabledDimensions, searchText]);

  const dataValidationError =
    revs.length === 0
      ? "onboarding-revs.json failed to validate as OnboardingRev[]. Check that each object has { id: string, metadata: { lineageRank: number } }."
      : null;

  const mappingWarning =
    activeLineageRank !== null && !revIdByRank.has(activeLineageRank)
      ? `Missing mapping: no rev found with metadata.lineageRank = ${activeLineageRank}`
      : null;

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <LogoButton />

      <OnboardingMeshTraversalPanel
        loadedCount={revs.length}
        dataValidationError={dataValidationError}
        mappingWarning={mappingWarning}
        activeNodeId={activeNodeId}
        hoveredNodeId={hoveredNodeId}
        sequentialTraversalStep={sequentialTraversalStep}
        activeLineageRank={activeLineageRank}
        activeTitle={activeRev?.title ?? null}
        canPrev={canPrev}
        canNextSequential={canNextSequential}
        canNextByRank={canNextByRank}
        onPrev={onPrev}
        onNextSequential={onNextSequential}
        onNextByRank={onNextByRank}
      />
        <ViewsToggleButton
        currentView={currentView}
        onChangeView={handleChangeView}
        onClearSelection={clearSelection}
        />;

      {currentView === '3d' ? (
        <OnboardingMesh3dGraph
            revs={revs}
            activeNodeId={activeNodeId}
            hoveredNodeId={hoveredNodeId}
            onSelectNode={handleSelect}
            setHoveredNodeId={setHoveredNodeId}
            guidedNextId={guidedNextId}
            visibleNodeIds={visibleNodeIds}
            dimensionById={dimensionById}
        />
        ) : (
        <OnboardingMesh2dGraph
            revs={revs}
            activeNodeId={activeNodeId}
            hoveredNodeId={hoveredNodeId}
            onSelectNode={handleSelect}
            setHoveredNodeId={setHoveredNodeId}
            dimensionById={dimensionById}
            iconSrcByDimension={iconSrcByDimension}
            guidedNextId={guidedNextId}
            visibleNodeIds={visibleNodeIds}
        />
        )}

      <OnboardingMeshRevPanel
        rev={activeRev}
        onSelectRev={handleSelect}
        onHoverTargetId={(id) => setHoveredNodeId(id)}
      />

      <OnboardingMeshRevList
        groups={revListGroups}
        selectedId={activeNodeId}
        onSelect={handleSelect}
        dimensionKeys={ALL_DIMENSIONS}
        enabledDimensions={enabledDimensions}
        toggleDimension={toggleDimension}
        searchText={searchText}
        setSearchText={setSearchText}
      />
    </div>
  );
};

export default OnboardingMesh;