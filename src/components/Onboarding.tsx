// src/pages/Onboarding.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods, NodeObject, LinkObject } from "react-force-graph-2d";
import "./Onboarding.css";

/** ---------- small utils ---------- */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type ScreenPos = { x: number; y: number };
type CardOffset = { dx: number; dy: number };
type CameraPreset = { centerX: number; centerY: number; zoom: number };

function endpointId(endpoint: unknown): NodeId | null {
  if (typeof endpoint === "string") return endpoint as NodeId;
  if (endpoint && typeof endpoint === "object" && "id" in endpoint) {
    return (endpoint as { id: string }).id as NodeId;
  }
  return null;
}

/** ---------- single source of truth ---------- */
const DEFAULT_CARD_OFFSET: CardOffset = { dx: 18, dy: -50 };
const INITIAL_CAMERA: CameraPreset = { centerX: 0, centerY: 0, zoom: 2.8 };

const BASE_Y_GAP = 180;
const BASE_X_WOBBLE = 90;

const NODE_CONFIGS = [
  {
    id: "purpose",
    label: "Purpose",
    copy: "Cael is a cognitive ecosystem.",
    x: 0,
    y: 0,
    step: 0,
    camera: { centerX: 0, centerY: 0, zoom: 1.4 },
    cardOffset: { dx: -320, dy: -50 },
  },
  {
    id: "seed",
    label: "Seed Event",
    copy: "Users create documents within that ecosystem.",
    x: BASE_X_WOBBLE * 2,
    y: BASE_Y_GAP * 1,
    step: 1,
    camera: { centerX: 150, centerY: 150, zoom: 1 },
    cardOffset: { dx: 40, dy: -50 },
  },
  {
    id: "body",
    label: "Body",
    copy:
      "Documents record insights, discoveries, personal events, or anything worth revisiting.",
    x: -BASE_X_WOBBLE,
    y: BASE_Y_GAP * 2,
    step: 2,
    camera: { centerX: -150, centerY: 300, zoom: 0.8 },
    cardOffset: { dx: -320, dy: -50 },
  },
  {
    id: "categories",
    label: "Categories",
    copy: "Documents are cross-linked through different relationship types and meanings.",
    x: BASE_X_WOBBLE,
    y: BASE_Y_GAP * 3,
    step: 3,
    camera: { centerX: 75, centerY: 450, zoom: 0.8 },
    cardOffset: { dx: 40, dy: -50 },
  },
  {
    id: "taxonomy",
    label: "Taxonomy",
    copy: "Documents are categorized using dimensions, families, and subfamilies.",
    x: -130,
    y: BASE_Y_GAP * 4 + 30,
    step: 4,
    camera: { centerX: -200, centerY: 750, zoom: 0.5 },
    cardOffset: { dx: -320, dy: -50 },
  },
  {
    id: "dimensions",
    label: "Dimensions",
    copy: "High-level axes: emotional architecture, recursion logic, etc.",
    x: -360,
    y: BASE_Y_GAP * 5 + 60,
    step: 5,
    camera: { centerX: -250, centerY: 775, zoom: 0.5 },
    cardOffset: { dx: -320, dy: -50 },
  },
  {
    id: "families",
    label: "Families",
    copy: "Mid-level groupings that cluster related revs.",
    x: -260,
    y: BASE_Y_GAP * 6 + 120,
    step: 6,
    camera: { centerX: -225, centerY: 800, zoom: 0.5 },
    cardOffset: { dx: -320, dy: -50 },
  },
  {
    id: "subfamilies",
    label: "Subfamilies",
    copy: "Fine-grained categories for precise placement.",
    x: -100,
    y: BASE_Y_GAP * 7 + 120,
    step: 7,
    camera: { centerX: -200, centerY: 825, zoom: 0.5 },
    cardOffset: { dx: -320, dy: -50 },
  },
  {
    id: "links",
    label: "Links",
    copy: "Direct navigation between thoughts—insight isn’t always sequential.",
    x: 320,
    y: BASE_Y_GAP * 4 + 30,
    step: 8,
    camera: { centerX: 200, centerY: 750, zoom: 0.5 },
    cardOffset: { dx: 40, dy: -50 },
  },
  {
    id: "tags",
    label: "Tags",
    copy: "Keywords for fast recall and semantic search.",
    x: 140,
    y: BASE_Y_GAP * 5 + 60,
    step: 9,
    camera: { centerX: 200, centerY: 800, zoom: 0.5 },
    cardOffset: { dx: -140, dy: 30 },
  },
  {
    id: "lemmas",
    label: "Lemmas",
    copy: "Some revs aren’t just related—they’re dependencies required for others.",
    x: 520,
    y: BASE_Y_GAP * 5 + 60,
    step: 10,
    camera: { centerX: 400, centerY: 800, zoom: 0.5 },
    cardOffset: { dx: 0, dy: 30 },
  },
  {
    id: "axiom",
    label: "Axiom",
    copy:
      "A distilled rule-of-thumb derived from purpose + seed + body: the cement of insight.",
    x: 0,
    y: BASE_Y_GAP * 9,
    step: 11,
    camera: { centerX: 0, centerY: 1000, zoom: 0.4 },
    cardOffset: { dx: 40, dy: -40 },
  },
  {
    id: "json",
    label: ".rev Object",
    copy: "All of this becomes one atomic object.",
    x: 0,
    y: BASE_Y_GAP * 10.2,
    step: 12,
    camera: { centerX: 0, centerY: 1500, zoom: 0.2 },
    cardOffset: { dx: -140, dy: 80 },
  },
] as const;

type NodeId = (typeof NODE_CONFIGS)[number]["id"];

type CaelNode = {
  id: NodeId;
  label: string;
  copy: string;
  x: number;
  y: number;
  fx: number;
  fy: number;
  visibleAtStep: number;
};

type LinkKind = "line" | "arc";

type CaelLink = {
  source: NodeId;
  target: NodeId;
  kind?: LinkKind;
};

type GraphData = {
  nodes: CaelNode[];
  links: CaelLink[];
};

type FGNode = NodeObject<CaelNode>;
type FGLink = LinkObject<CaelNode, CaelLink>;

/** ---------- derived structures ---------- */
const STEP_ORDER: NodeId[] = NODE_CONFIGS.slice()
  .sort((a, b) => a.step - b.step)
  .map((n) => n.id);

const MAX_STEP = STEP_ORDER.length - 1;

const NODES: CaelNode[] = NODE_CONFIGS.map((n) => ({
  id: n.id,
  label: n.label,
  copy: n.copy,
  x: n.x,
  y: n.y,
  fx: n.x,
  fy: n.y,
  visibleAtStep: n.step,
}));

const NODES_BY_ID: Record<NodeId, CaelNode> = NODES.reduce((acc, n) => {
  acc[n.id] = n;
  return acc;
}, {} as Record<NodeId, CaelNode>);

const CAMERA_PRESETS: Partial<Record<NodeId, CameraPreset>> = NODE_CONFIGS.reduce(
  (acc, n) => {
    if (n.camera) acc[n.id] = n.camera;
    return acc;
  },
  {} as Partial<Record<NodeId, CameraPreset>>
);

const CARD_OFFSETS: Partial<Record<NodeId, CardOffset>> = NODE_CONFIGS.reduce(
  (acc, n) => {
    if (n.cardOffset) acc[n.id] = n.cardOffset;
    return acc;
  },
  {} as Partial<Record<NodeId, CardOffset>>
);

const LINKS: CaelLink[] = [
  { source: "purpose", target: "seed" },
  { source: "seed", target: "body" },
  { source: "body", target: "categories" },

  { source: "categories", target: "taxonomy" },
  { source: "categories", target: "links" },

  { source: "taxonomy", target: "dimensions" },
  { source: "dimensions", target: "families" },
  { source: "families", target: "subfamilies" },

  { source: "links", target: "tags" },
  { source: "links", target: "lemmas" },

  { source: "purpose", target: "axiom", kind: "arc" },
  { source: "seed", target: "axiom", kind: "arc" },
  { source: "body", target: "axiom", kind: "arc" },

  { source: "axiom", target: "json" },
];

/** ---------- helpers ---------- */
function getVisibleNodeIds(step: number): Set<NodeId> {
  // pre-start: show only purpose
  if (step < 0) return new Set<NodeId>(["purpose"]);

  const ids = new Set<NodeId>();

  // revealed (<= step)
  for (const n of NODES) {
    if (n.visibleAtStep <= step) ids.add(n.id);
  }

  // exactly one next node (step + 1)
  const nextStep = step + 1;
  const nextId = STEP_ORDER[nextStep];
  if (nextId) ids.add(nextId);

  return ids;
}

function buildGraphData(step: number): GraphData {
  const visibleIds = getVisibleNodeIds(step);
  const nodes = NODES.filter((n) => visibleIds.has(n.id));

  // revealed nodes (<= step) only; "next" node excluded so it stays edge-less
  const revealedIds = new Set<NodeId>(
    NODES.filter((n) => n.visibleAtStep <= step).map((n) => n.id)
  );

  const links: CaelLink[] =
    step < 0
      ? []
      : LINKS.flatMap((l) => {
          const sourceId = endpointId(l.source);
          const targetId = endpointId(l.target);

          if (!sourceId || !targetId) return [];
          if (!revealedIds.has(sourceId) || !revealedIds.has(targetId)) return [];

          // IMPORTANT: return a fresh object so ForceGraph can mutate without
          // poisoning our LINK source-of-truth across renders.
          return [{ ...l, source: sourceId, target: targetId }];
        });

  return { nodes, links };
}


/** ---------- component ---------- */
export default function Onboarding() {
  const graphRef = useRef<ForceGraphMethods<FGNode, FGLink> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  // step: -1 means “not started yet”
  const [step, setStep] = useState<number>(-1);
  const [screenPos, setScreenPos] = useState<Partial<Record<NodeId, ScreenPos>>>({});

  const activeNodeId: NodeId = useMemo(() => {
    if (step < 0) return "purpose";
    return STEP_ORDER[clamp(step, 0, MAX_STEP)];
  }, [step]);

  const activeNode = useMemo(() => NODES_BY_ID[activeNodeId], [activeNodeId]);

  const graphData = useMemo(() => buildGraphData(step), [step]);

  const viewPreset: CameraPreset = useMemo(() => {
    if (step < 0) return INITIAL_CAMERA;

    const preset = CAMERA_PRESETS[activeNodeId];
    if (preset) return preset;

    // fallback
    return { centerX: activeNode.x, centerY: activeNode.y, zoom: 1.6 };
  }, [step, activeNodeId, activeNode.x, activeNode.y]);

  // camera move on view change
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const ms = 450;
    isTransitioningRef.current = true;

    graph.centerAt(viewPreset.centerX, viewPreset.centerY, ms);
    graph.zoom(viewPreset.zoom, ms);

    const t = window.setTimeout(() => {
      isTransitioningRef.current = false;
    }, ms + 50);

    return () => window.clearTimeout(t);
  }, [viewPreset]);

  // screen-space positions for visible nodes
  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const graph = graphRef.current;
      if (graph) {
        const next: Partial<Record<NodeId, ScreenPos>> = {};
        for (const n of graphData.nodes) {
          const p = graph.graph2ScreenCoords(n.x, n.y);
          next[n.id] = { x: p.x, y: p.y };
        }
        setScreenPos(next);
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [graphData.nodes]);

  // wheel = step +/- 1 with 1s block
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const SCROLL_THRESHOLD = 8;
    const BLOCK_MS = 1000;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isTransitioningRef.current) return;
      if (Math.abs(e.deltaY) < SCROLL_THRESHOLD) return;

      const direction = e.deltaY > 0 ? 1 : -1;

      // first scroll starts at step 0 (purpose)
      setStep((prev) => {
        const base = prev < 0 ? 0 : prev;
        const next = clamp(base + direction, 0, MAX_STEP);

        if (next === base) return prev;

        isTransitioningRef.current = true;
        window.setTimeout(() => {
          isTransitioningRef.current = false;
        }, BLOCK_MS);

        return next;
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleNodeClick = (node: CaelNode) => {
    if (isTransitioningRef.current) return;

    // clicking starts (or jumps) to that node’s step
    setStep(node.visibleAtStep);
  };

  const hasStarted = step >= 0;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", height: "100vh", width: "100vw", backgroundColor: "#fff" }}
    >
      <ForceGraph2D<CaelNode, CaelLink>
        ref={graphRef}
        graphData={graphData}
        nodeId="id"
        enableNodeDrag={false}
        enableZoomInteraction={false}
        enablePanInteraction={false}
        cooldownTime={0}
        linkCurvature={(l) => (l.kind === "arc" ? 0.25 : 0)}
        linkWidth={1}
        linkColor={() => "rgba(0,0,0,0.25)"}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node, ctx, globalScale) => {
          void globalScale;
          const radius = 8;
          const isActive = node.id === activeNodeId;

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = isActive ? "rgba(253,182,2,0.95)" : "rgba(0,0,0,0.75)";
          ctx.fill();
        }}
      />

      {/* node text boxes */}
      {hasStarted &&
        activeNodeId !== "json" &&
        graphData.nodes
          .filter((n) => n.visibleAtStep <= step)
          .map((n) => {
            const p = screenPos[n.id];
            if (!p) return null;

            const offset = CARD_OFFSETS[n.id] ?? DEFAULT_CARD_OFFSET;

            return (
              <div
                key={n.id}
                className="onboarding-node-card"
                style={{
                  left: p.x,
                  top: p.y,
                  transform: `translate(${offset.dx}px, ${offset.dy}px)`,
                }}
              >
                <div className="onboarding-node-card-title">{n.label}</div>
                <div className="onboarding-node-card-copy">{n.copy}</div>
              </div>
            );
          })}
    </div>
  );
}
