// src/pages/OnboardingMesh.tsx
// Add a visibleNodeIds Set derived from enabledDimensions + searchText,
// and ALWAYS include activeNodeId (Option A).
// Then pass visibleNodeIds to the graph.
// ✅ Updated: search now supports selectable fields:
// id, title, purpose, seedEvent, body, dimensions, families, subfamilies
// ✅ Updated: mobile detection clamps view to 2d (no setState-in-effect)

import React, { useMemo, useState, useRef, useEffect } from "react";
import onboardingRevsRaw from "../data/onboarding-revs-final.json";
import OnboardingMesh2dGraph from "../components/OnboardingMesh2dGraph";
import OnboardingMeshRevPanel from "../components/OnboardingMeshRevPanel";
import OnboardingMeshRevList from "../components/OnboardingMeshRevList";
import LogoButton from "../components/LogoButton";
import OnboardingMeshTraversalPanel from "../components/OnboardingMeshTraversalPanel";
import OnboardingMesh3dGraph from "../components/OnboardingMesh3dGraph";
import ViewsToggleButton, {
  type DimensionalView,
} from "../components/ViewsToggleButton";

import GENESIS_ICON from "/assets/genesis-icon.png";
import FOUNDATIONS_ICON from "/assets/foundations-icon.png"
import OUTCOMES_ICON from "/assets/outcomes-icon.png";
import TRAVERSAL_NAV_ICON from "/assets/traversal-icon.png";
import EVALUATION_ICON from "/assets/evaluation-icon.png";
import RELATIONSHIPS_ICON from "/assets/relationships-icon.png";
import UNITS_ICON from "/assets/units-icon.png";
import STRUCTURE_ICON from "/assets/structure-icon.png";
import RUNTIME_USAGE_ICON from "/assets/runtime-icon.png";

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

export type RevTaxonomy = {
  dimensions?: string[];
  families?: string[];
  subfamilies?: string[];
};

export type OnboardingRev = {
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
  taxonomy?: RevTaxonomy;

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
  | "FOUNDATIONS"
  | "UNITS"
  | "RELATIONSHIPS"
  | "STRUCTURE"
  | "TRAVERSAL_AND_NAVIGATION"
  | "EVALUATION"
  | "RUNTIME_AND_USAGE"
  | "OUTCOMES";

const ALL_DIMENSIONS: DimensionKey[] = [
  "GENESIS",
  "FOUNDATIONS",
  "UNITS",
  "RELATIONSHIPS",
  "STRUCTURE",
  "TRAVERSAL_AND_NAVIGATION",
  "EVALUATION",
  "RUNTIME_AND_USAGE",
  "OUTCOMES",
];

// -------------------------
// Dimensions (IDs)
// -------------------------
const GENESIS: RevId[] = ["genesis.rev"];

const FOUNDATIONS: RevId[] = [
  "cognitive.abstraction.rev",
  "cognitive.to.computational.mapping.rev",
  "architecture.why.it.matters.rev",
  "cognitive.feedback.loop.rev",
];

const UNITS: RevId[] = [
  "thoughts.to.objects.bridge.rev",
  "structured.fields.rev",
  "rev.canonical.form.architecture.rev",
  "rev.schema.contract.rev",
  "archetype.assignment.logic.rev",
  "rev.versioning.protocol.rev",
];

const RELATIONSHIPS: RevId[] = [
  "links.between.insights.rev",
  "lemma.architecture.rev",
  "implicit.dependency.chains.rev",
  "lemma.dependency.mapping.rev",
];

const STRUCTURE: RevId[] = [
  "graph.representations.of.knowledge.rev",
  "graph.node.edge.model.rev",
  "node.gravity.rev",
  "lineageRank.calculation.rev",
  "embedding.mesh.rev",
  "structural.embedding.rev",
  "fusion.embedding.rev",
  "structural.pattern.detection.rev",
];

const TRAVERSAL_AND_NAVIGATION: RevId[] = [
  "structure.to.motion.bridge.rev",
  "dependency.traversal.logic.rev",
  "dimension.family.taxonomy.rev",
  "taxonomy.assignment.rules.rev",
  "taxonomy.navigation.ui.rev",
  "search.filter.engine.rev",
];

const EVALUATION: RevId[] = [
  "gifted.edge.weight.rev",
  "temporal.mesh.coherence.rev",
  "evaluation.criteria.for.knowledge.operations.rev",
  "coherence.loss.function.rev",
];

const RUNTIME_AND_USAGE: RevId[] = [
  "symbolic.runtime.rev",
  "runtime.flow.controller.rev",
  "cognitive.role.services.rev",
  "neural.handshake.rev",
  "session.state.engine.rev",
  "chat.capture.intervals.rev",
  "rebel.permission.gates.rev",
  "orphan.safety.signals.rev",
];

const OUTCOMES: RevId[] = [
  "graph.analytics.engine.rev",
  "glyph.constellation.rev",
  "mesh.depth.pruning.rev",
  "externalizing.cognitive.architecture.rev",
  "personal.to.public.cognitive.platform.rev",
  "cognitive.mirror.effect.rev",
];

const iconSrcByDimension: Partial<Record<DimensionKey, string>> = {
  GENESIS: GENESIS_ICON,
  FOUNDATIONS: FOUNDATIONS_ICON,
  UNITS: UNITS_ICON,
  RELATIONSHIPS: RELATIONSHIPS_ICON,
  STRUCTURE: STRUCTURE_ICON,
  TRAVERSAL_AND_NAVIGATION: TRAVERSAL_NAV_ICON,
  EVALUATION: EVALUATION_ICON,
  RUNTIME_AND_USAGE: RUNTIME_USAGE_ICON,
  OUTCOMES: OUTCOMES_ICON,
};

// Normalize strings
function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function normalizeArray(arr?: string[]): string {
  return (arr ?? []).join(" ");
}

function joinParts(parts: Array<string | undefined | null>): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .join(" ");
}

// -------------------------
// Branches (lineageRank order)
// -------------------------
const BRANCH_0: LineageRank[] = [1];
const BRANCH_1: LineageRank[] = [2, 3, 4, 5];
const BRANCH_2: LineageRank[] = [6, 7, 8, 9, 10, 11];
const BRANCH_3: LineageRank[] = [12, 13, 14, 15];
const BRANCH_4: LineageRank[] = [16, 17, 18, 19, 20, 21, 22, 23];
const BRANCH_5: LineageRank[] = [24, 25, 26, 27, 28, 29];
const BRANCH_6: LineageRank[] = [30, 31, 32, 33];
const BRANCH_7: LineageRank[] = [34, 35, 36, 37, 38, 39, 40, 41];
const BRANCH_8: LineageRank[] = [42, 43, 44, 45, 46, 47];

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

// -------------------------
// Search field toggles (multi-select)
// -------------------------
type SearchFieldKey =
  | "id"
  | "title"
  | "purpose"
  | "seedEvent"
  | "body"
  | "dimensions"
  | "families"
  | "subfamilies";

export type SearchFields = Record<SearchFieldKey, boolean>;

const DEFAULT_SEARCH_FIELDS: SearchFields = {
  id: true,
  title: true,
  purpose: true,
  seedEvent: true,
  body: true,
  dimensions: true,
  families: true,
  subfamilies: true,
};

const OnboardingMesh: React.FC = () => {
  const revs: OnboardingRev[] = useMemo(() => {
    const raw: unknown = onboardingRevsRaw;
    if (!isOnboardingRevArray(raw)) return [];
    return raw;
  }, []);

  // -------------------------
  // Viewport sizing (mobile vs desktop)
  // -------------------------
  const MOBILE_BREAKPOINT_PX = 768;

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);

    const sync = () => setIsMobile(mq.matches);

    sync();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }

    // fallback for older browsers
    mq.addListener(sync);
    return () => mq.removeListener(sync);
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
    for (const id of FOUNDATIONS) map.set(id, "FOUNDATIONS");
    for (const id of UNITS) map.set(id, "UNITS");
    for (const id of RELATIONSHIPS) map.set(id, "RELATIONSHIPS");
    for (const id of STRUCTURE) map.set(id, "STRUCTURE");
    for (const id of TRAVERSAL_AND_NAVIGATION)
      map.set(id, "TRAVERSAL_AND_NAVIGATION");
    for (const id of EVALUATION) map.set(id, "EVALUATION");
    for (const id of RUNTIME_AND_USAGE) map.set(id, "RUNTIME_AND_USAGE");
    for (const id of OUTCOMES) map.set(id, "OUTCOMES");

    return map;
  }, []);

  const [sequentialTraversalStep, setSequentialTraversalStep] = useState<number>(
    () => clamp(0, 0, maxStep)
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
  const [searchFields, setSearchFields] = useState<SearchFields>(
    () => DEFAULT_SEARCH_FIELDS
  );

  const setSearchFieldEnabled = (
    key: SearchFieldKey,
    enabled: boolean
  ): void => {
    setSearchFields((prev) => {
      const next: SearchFields = { ...prev, [key]: enabled };
      const anyOn = Object.values(next).some(Boolean);
      return anyOn ? next : prev; // prevent all-off
    });
  };

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
  // Selection entrypoint + views
  // -------------------------
  const [currentView, setCurrentView] = useState<DimensionalView>("2d");

  // ✅ clamp render view on mobile (no setState-in-effect)
  const effectiveView: DimensionalView = isMobile ? "2d" : currentView;

  const handleChangeView = (view: DimensionalView): void => {
    // ✅ hard gate: don't allow selecting 3d on mobile
    if (isMobile && view === "3d") return;
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

  const activeRevBase: OnboardingRev | null = revById.get(activeNodeId) ?? null;
  const activeRev: OnboardingRev | null = useMemo(() => {
    return resolveRevVersionForRank(activeRevBase, activeLineageRank);
  }, [activeRevBase, activeLineageRank]);

  // -------------------------
  // Search index (field-aware)
  // -------------------------
  const searchIndexById = useMemo(() => {
    const map = new Map<RevId, string>();

    for (const r of revs) {
      const tax = r.taxonomy;

      const parts: string[] = [];

      if (searchFields.id) parts.push(r.id);
      if (searchFields.title) parts.push(r.title ?? "");
      if (searchFields.purpose) parts.push(r.purpose ?? "");
      if (searchFields.seedEvent) parts.push(r.seedEvent ?? "");
      if (searchFields.body) parts.push(r.body ?? "");

      if (searchFields.dimensions) parts.push(normalizeArray(tax?.dimensions));
      if (searchFields.families) parts.push(normalizeArray(tax?.families));
      if (searchFields.subfamilies)
        parts.push(normalizeArray(tax?.subfamilies));

      map.set(r.id, normalize(joinParts(parts)));
    }

    return map;
  }, [revs, searchFields]);

  // ✅ Visible node ids for Graph (Option A: always include active)
  const visibleNodeIds = useMemo(() => {
    const q = normalize(searchText);
    const set = new Set<RevId>();

    for (const r of revs) {
      const dim = dimensionById.get(r.id);
      if (!dim) continue;
      if (!enabledDimensions.has(dim)) continue;

      if (q.length > 0) {
        const hay = searchIndexById.get(r.id) ?? "";
        if (!hay.includes(q)) continue;
      }

      set.add(r.id);
    }

    // Option A: never hide the active node
    set.add(activeNodeId);

    return set;
  }, [
    revs,
    dimensionById,
    enabledDimensions,
    searchText,
    activeNodeId,
    searchIndexById,
  ]);

  // Grouped list data (reuses same predicate)
  const revListGroups = useMemo(() => {
    const q = normalize(searchText);

    const items = revs.map((r) => {
      const dimension = dimensionById.get(r.id) ?? "UNITS";
      const title = r.title ?? r.id;

      return {
        id: r.id,
        title,
        dimension,
        lineageRank: r.metadata.lineageRank,
        _search: searchIndexById.get(r.id) ?? normalize(`${title} ${r.id}`),
      };
    });

    const filteredByDim = items.filter((it) =>
      enabledDimensions.has(it.dimension)
    );

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
  }, [revs, dimensionById, enabledDimensions, searchText, searchIndexById]);

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
      <LogoButton/>

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

        currentView={effectiveView}
        onChangeView={handleChangeView}
        onClearSelection={clearSelection}
      />

      {/* ✅ never show 3d on mobile */}
      {effectiveView === "3d" ? (
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
        dimensionById={dimensionById}
        taxonomy={activeRev?.taxonomy ?? null}
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
        searchFields={searchFields}
        setSearchFieldEnabled={setSearchFieldEnabled}
      />
    </div>
  );
};

export default OnboardingMesh;
