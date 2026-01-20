// 2) src/components/OnboardingMesh2dGraph.tsx
// Add a visibleNodeIds prop, filter nodes/links using it.
// IMPORTANT: filter links where both endpoints are visible.

import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type {
  ForceGraphMethods,
  NodeObject,
  LinkObject,
} from "react-force-graph-2d";
import "./MeshTopologyView.css";

type RevId = string;
type LineageRank = number;

type OnboardingRevLink = {
  targetId: RevId;
  type?: string;
  note?: string;
  confidence?: number;
};

export type OnboardingRev = {
  id: RevId;
  title?: string;
  purpose?: string;
  seedEvent?: string;
  body?: string;
  axiom?: string;
  links?: OnboardingRevLink[];
  metadata: {
    lineageRank: LineageRank;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type GraphNode = {
  id: RevId;
  label?: string;
  lineageRank?: LineageRank;
  degree?: number;

  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

type GraphLink = LinkObject<GraphNode> & {
  type?: string;
};

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

const SELECTED_ZOOM_MULTIPLIER = 1;

const STRAIGHT_TYPES = new Set<string>(["axiom", "lemma", "contradicts"]);
const MID_CURVE_TYPES = new Set<string>(["corollary", "parallel", "related"]);
const HIGH_CURVE_TYPES = new Set<string>([
  "prerequisite",
  "supports",
  "validates",
  "governs",
  "informs",
]);

const DEFAULT_EDGE_COLOR = "rgba(255, 255, 255, 0.25)";
const DEFAULT_EDGE_COLOR_DIM = "rgba(255, 255, 255, 0.2)";
const GUIDED_EDGE_COLOR = "rgba(255, 255, 255, 0.95)";

const LINK_TYPE_COLOR: Record<string, string> = {
  corollary: "rgba(180, 140, 255, 0.9)",
  axiom: "rgba(255, 215, 90, 0.9)",
  lemma: "rgba(120, 200, 255, 0.9)",
  informs: "rgba(90, 255, 180, 0.9)",
  refines: "rgba(255, 140, 140, 0.9)",
  parallel: "rgba(255, 255, 255, 0.75)",
  generalizes: "rgba(255, 180, 90, 0.9)",
};

function withAlpha(rgba: string, alpha: number): string {
  const m = rgba.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)$/);
  if (!m) return rgba;
  const r = m[1];
  const g = m[2];
  const b = m[3];
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function isFGNode(
  node: NodeObject<GraphNode>
): node is NodeObject<GraphNode> & { x: number; y: number } {
  return typeof node.x === "number" && typeof node.y === "number";
}

function getLinkCurvature(link: GraphLink): number {
  const t = (link.type ?? "").toString();
  if (STRAIGHT_TYPES.has(t)) return 0;
  if (MID_CURVE_TYPES.has(t)) return 0.125;
  if (HIGH_CURVE_TYPES.has(t)) return 0.25;
  return 0.15;
}

function endpointId(endpoint: GraphLink["source"]): RevId | null {
  if (endpoint == null) return null;

  if (typeof endpoint === "string" || typeof endpoint === "number") {
    return String(endpoint);
  }

  const obj = endpoint as unknown as { id?: unknown };
  return typeof obj.id === "string" ? obj.id : null;
}

function buildOutgoingTargets(nodeId: RevId | null, links: GraphLink[]): Set<RevId> {
  const set = new Set<RevId>();
  if (!nodeId) return set;

  for (const link of links) {
    const s = endpointId(link.source);
    const t = endpointId(link.target);
    if (!s || !t) continue;
    if (s === nodeId) set.add(t);
  }

  return set;
}

function buildGraphFromOnboardingRevs(
  revs: OnboardingRev[]
): { nodes: NodeObject<GraphNode>[]; links: GraphLink[] } {
  const nodesById = new Map<RevId, NodeObject<GraphNode>>();
  const degreeById = new Map<RevId, number>();

  for (const rev of revs) {
    nodesById.set(rev.id, {
      id: rev.id,
      label: rev.title ?? rev.id,
      lineageRank: rev.metadata?.lineageRank,
      degree: 0,
    });
    degreeById.set(rev.id, 0);
  }

  const links: GraphLink[] = [];

  for (const rev of revs) {
    const sourceId = rev.id;
    for (const l of rev.links ?? []) {
      const targetId = l.targetId;
      if (!targetId) continue;

      if (!nodesById.has(targetId)) {
        nodesById.set(targetId, { id: targetId, label: targetId, degree: 0 });
        degreeById.set(targetId, 0);
      }

      const type = l.type ?? "related";

      links.push({ source: sourceId, target: targetId, type });

      degreeById.set(sourceId, (degreeById.get(sourceId) ?? 0) + 1);
      degreeById.set(targetId, (degreeById.get(targetId) ?? 0) + 1);
    }
  }

  const nodes: NodeObject<GraphNode>[] = [];
  for (const [id, node] of nodesById.entries()) {
    nodes.push({ ...node, degree: degreeById.get(id) ?? 0 });
  }

  return { nodes, links };
}

export interface OnboardingMesh2dGraphProps {
  revs: OnboardingRev[];

  activeNodeId: RevId;
  hoveredNodeId: RevId | null;

  setHoveredNodeId: (id: RevId | null) => void;
  onSelectNode: (id: RevId) => void;

  dimensionById: Map<RevId, DimensionKey>;
  iconSrcByDimension: Partial<Record<DimensionKey, string>>;

  guidedNextId: RevId | null;

  visibleNodeIds: Set<RevId>; // ✅ new
}

const OnboardingMesh2dGraph: React.FC<OnboardingMesh2dGraphProps> = ({
  revs,
  activeNodeId,
  hoveredNodeId,
  setHoveredNodeId,
  onSelectNode,
  dimensionById,
  iconSrcByDimension,
  guidedNextId,
  visibleNodeIds, // ✅ new
}) => {
  const graphRef = useRef<
    ForceGraphMethods<NodeObject<GraphNode>, GraphLink> | undefined
  >(undefined);

  const [isLayoutFrozen, setIsLayoutFrozen] = useState(false);

  const { nodes: rawNodes, links: rawLinks } = useMemo(
    () => buildGraphFromOnboardingRevs(revs),
    [revs]
  );

  // ✅ Filter nodes + links by visibility
  const { nodes, links } = useMemo(() => {
    const filteredNodes = rawNodes.filter((n) => visibleNodeIds.has(n.id));
    const filteredLinks = rawLinks.filter((l) => {
      const s = endpointId(l.source);
      const t = endpointId(l.target);
      if (!s || !t) return false;
      return visibleNodeIds.has(s) && visibleNodeIds.has(t);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [rawNodes, rawLinks, visibleNodeIds]);

  const iconImageByDimension = useMemo(() => {
    const map = new Map<DimensionKey, HTMLImageElement>();

    (Object.keys(iconSrcByDimension) as DimensionKey[]).forEach((key) => {
      const src = iconSrcByDimension[key];
      if (!src) return;

      const img = new Image();
      img.src = src;
      map.set(key, img);
    });

    return map;
  }, [iconSrcByDimension]);

  // Directional adjacency sets, computed on *filtered* links
  const activeOutgoingTargets = useMemo(
    () => buildOutgoingTargets(activeNodeId ?? null, links),
    [activeNodeId, links]
  );

  const hoveredOutgoingTargets = useMemo(
    () => buildOutgoingTargets(hoveredNodeId ?? null, links),
    [hoveredNodeId, links]
  );

  // Force tuning
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    if (!nodes.length) return;

    const linkForce = graph.d3Force("link") as
      | { distance?: (d: number) => void }
      | undefined;
    if (linkForce?.distance) linkForce.distance(200);

    const chargeForce = graph.d3Force("charge") as
      | { strength?: (s: number) => void }
      | undefined;
    if (chargeForce?.strength) chargeForce.strength(-220);

    graph.d3ReheatSimulation();
  }, [nodes, links]);

  // Zoom / center on active (works even if active is forced visible)
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    if (!nodes.length) return;

    const transitionMs = 600;

    const targetNode = nodes.find((n) => n.id === activeNodeId);
    if (!targetNode || !isFGNode(targetNode)) return;

    graph.centerAt(targetNode.x, targetNode.y, transitionMs);

    const selectedZoom = graph.zoom() * SELECTED_ZOOM_MULTIPLIER;
    graph.zoom(selectedZoom, transitionMs);
  }, [activeNodeId, nodes]);

  if (!nodes.length) {
    return <div className="mesh-topology-loading">No mesh data.</div>;
  }

  const isGuidedEdge = (link: GraphLink): boolean => {
    if (!guidedNextId) return false;
    const s = endpointId(link.source);
    const t = endpointId(link.target);
    if (!s || !t) return false;

    return (
      (s === activeNodeId && t === guidedNextId) ||
      (s === guidedNextId && t === activeNodeId)
    );
  };

  const isActiveOutgoingEdge = (link: GraphLink): boolean => {
    const s = endpointId(link.source);
    const t = endpointId(link.target);
    if (!s || !t) return false;
    return s === activeNodeId && activeOutgoingTargets.has(t);
  };

  const isHoveredOutgoingEdge = (link: GraphLink): boolean => {
    if (!hoveredNodeId) return false;
    const s = endpointId(link.source);
    const t = endpointId(link.target);
    if (!s || !t) return false;
    return s === hoveredNodeId && hoveredOutgoingTargets.has(t);
  };

  const linkColor = (linkObj: LinkObject<GraphNode>): string => {
    const link = linkObj as GraphLink;

    if (isGuidedEdge(link)) return GUIDED_EDGE_COLOR;

    const activeOutgoing = isActiveOutgoingEdge(link);
    const hoverOutgoing = isHoveredOutgoingEdge(link);

    if (!activeOutgoing && !hoverOutgoing) return DEFAULT_EDGE_COLOR_DIM;

    const typeKey = (link.type ?? "").toString();
    const base = LINK_TYPE_COLOR[typeKey] ?? DEFAULT_EDGE_COLOR;

    if (activeOutgoing) return withAlpha(base, 0.9);
    return withAlpha(base, 0.6);
  };

  const linkWidth = (linkObj: LinkObject<GraphNode>): number => {
    const link = linkObj as GraphLink;

    if (isGuidedEdge(link)) return 1.3;

    const activeOutgoing = isActiveOutgoingEdge(link);
    const hoverOutgoing = isHoveredOutgoingEdge(link);

    if (activeOutgoing) return 1.5;
    if (hoverOutgoing) return 0.85;
    return 0.2;
  };

  return (
    <div className="mesh-topology-container" style={{ backgroundColor: "#20324e" }}>
      <ForceGraph2D<NodeObject<GraphNode>, GraphLink>
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeId="id"
        enableNodeDrag={false}
        linkCurvature={(link) => getLinkCurvature(link as GraphLink)}
        linkColor={linkColor}
        linkWidth={linkWidth}
        cooldownTime={isLayoutFrozen ? 0 : 1000}
        onEngineStop={() => {
          if (isLayoutFrozen) return;

          nodes.forEach((node) => {
            if (typeof node.x === "number" && typeof node.y === "number") {
              node.fx = node.x;
              node.fy = node.y;
            }
          });

          setIsLayoutFrozen(true);
        }}
        onNodeHover={(node) => {
          const id = node ? (node as NodeObject<GraphNode>).id : null;
          setHoveredNodeId(id);
        }}
        onNodeClick={(node) => {
          const n = node as NodeObject<GraphNode>;
          onSelectNode(n.id);
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as NodeObject<GraphNode>;
          const x = n.x;
          const y = n.y;
          if (typeof x !== "number" || typeof y !== "number") return;

          const isActive = n.id === activeNodeId;
          const isHovered = hoveredNodeId !== null && n.id === hoveredNodeId;
          const isNext = guidedNextId !== null && n.id === guidedNextId;

          const baseSize = 24 + Math.log1p(n.degree ?? 0) * 6;
          const sizeMult = isActive ? 1.25 : isNext || isHovered ? .85 : 0.55;
          const alpha = isActive ? 1.0 : isNext || isHovered ? 1.0 : 0.5;

          const size = (baseSize * sizeMult * 1.25) / globalScale;

          if (isNext) {
            ctx.save();

            ctx.beginPath();
            ctx.arc(x, y, size * 0.95, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(103, 107, 209, 0.987)";
            ctx.lineWidth = .75 / globalScale;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, size * 0.72, 0, 4 * Math.PI);
            ctx.strokeStyle = "rgba(103, 107, 209, 0.987)";
            ctx.lineWidth = 1 / globalScale;
            ctx.stroke();

            ctx.restore();
          }

          if (isActive) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size * .1, 0, 5 * Math.PI);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 75 / globalScale;
            ctx.stroke();
            ctx.restore();
          }

          if (n.id === "genesis.rev" && !isActive) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size * .1, 0, 5 * Math.PI);
            ctx.strokeStyle = "rgba(238, 246, 89, 0.33)";
            ctx.lineWidth = 50 / globalScale;
            ctx.stroke();
            ctx.restore();
          }

          const dimension = dimensionById.get(n.id);
          const img = dimension ? iconImageByDimension.get(dimension) : undefined;

          ctx.save();
          ctx.globalAlpha = alpha;

          if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
            ctx.restore();
            return;
          }

          const radius = (6 + Math.log1p(n.degree ?? 0)) / globalScale;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fill();
          ctx.restore();
        }}
        nodePointerAreaPaint={(node, paintColor, ctx) => {
          const n = node as NodeObject<GraphNode>;
          const x = n.x;
          const y = n.y;
          if (typeof x !== "number" || typeof y !== "number") return;

          const isActive = n.id === activeNodeId;
          const isHovered = hoveredNodeId !== null && n.id === hoveredNodeId;
          const isNext = guidedNextId !== null && n.id === guidedNextId;

          const base = 18 + Math.log1p(n.degree ?? 0) * 2;
          const sizeMult = isActive ? 1.25 : isNext || isHovered ? 1.0 : 0.8;
          const r = base * sizeMult;

          ctx.fillStyle = paintColor;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fill();
        }}
        nodeLabel={(node) =>
          (node as NodeObject<GraphNode>).label ?? (node as NodeObject<GraphNode>).id
        }
      />
    </div>
  );
};

export default OnboardingMesh2dGraph;
