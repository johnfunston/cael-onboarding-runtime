// src/components/MeshTopologyView3D.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import type { NodeObject, LinkObject } from "react-force-graph-3d";
import * as THREE from "three";
import "./MeshTopologyView3D.css";

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
  links?: OnboardingRevLink[];
  metadata: {
    lineageRank: LineageRank;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type GraphNode = NodeObject & {
  id: RevId;
  label: string;
  lineageRank?: LineageRank;
  degree: number;
};

type GraphLink = LinkObject & {
  source: RevId | GraphNode;
  target: RevId | GraphNode;
  type?: string;
};

type ForceWithDistance = {
  distance: (dist: number) => unknown;
};

type ForceWithStrength = {
  strength: (val: number) => unknown;
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

interface MeshTopologyView3DProps {
  revs: OnboardingRev[];

  activeNodeId: RevId;
  hoveredNodeId: RevId | null;

  onSelectNode: (id: RevId) => void;
  setHoveredNodeId: (id: RevId | null) => void;

  guidedNextId: RevId | null;
  visibleNodeIds: ReadonlySet<RevId>;

  // ✅ new
  dimensionById: Map<RevId, DimensionKey>;
}


interface MeshTopologyView3DProps {
  revs: OnboardingRev[];

  activeNodeId: RevId;
  hoveredNodeId: RevId | null;

  onSelectNode: (id: RevId) => void;
  setHoveredNodeId: (id: RevId | null) => void;

  guidedNextId: RevId | null;

  visibleNodeIds: ReadonlySet<RevId>;
}

const DEFAULT_CAMERA_DISTANCE = 2000;

type CameraPosition = {
  x: number;
  y: number;
  z: number;
};

const DEFAULT_CAMERA_POSITION: CameraPosition = {
  x: 0,
  y: 0,
  z: DEFAULT_CAMERA_DISTANCE,
};

const SELECTED_DISTANCE_MULTIPLIER = .5; // 2x "zoom in" = half the distance

const DEFAULT_EDGE_COLOR_DIM = "rgba(255, 255, 255, 0.33)";
const DEFAULT_EDGE_COLOR = "rgba(255, 255, 255, 0.5)";
const GUIDED_EDGE_COLOR = "rgba(255, 255, 255, 1)";

const LINK_TYPE_COLOR: Record<string, string> = {
  corollary: "rgba(180, 140, 255, 0.9)",
  axiom: "rgba(255, 215, 90, 0.9)",
  lemma: "rgba(120, 200, 255, 0.9)",
  informs: "rgba(90, 255, 180, 0.9)",
  refines: "rgba(255, 140, 140, 0.9)",
  parallel: "rgba(255, 255, 255, 0.75)",
  generalizes: "rgba(255, 180, 90, 0.9)",
};

const DIMENSION_COLOR: Record<DimensionKey, string> = {
  GENESIS: "rgba(238, 246, 89, 0.95)",
  PROBLEM: "rgba(255, 140, 140, 0.9)",
  PROPOSAL: "rgba(180, 140, 255, 0.9)",
  MECHANISM: "rgba(120, 200, 255, 0.9)",
  TEMPORAL_EVOLUTION: "rgba(255, 180, 90, 0.9)",
  NAVIGATION_UI: "rgba(90, 255, 180, 0.9)",
  ANALYTICS_ENGINE: "rgba(255, 255, 255, 0.75)",
  CLASSIFICATION_LAYER: "rgba(255, 215, 90, 0.9)",
  GRAPH_STRUCTURE: "rgba(120, 200, 255, 0.75)",
  SEMANTIC_VECTOR: "rgba(180, 140, 255, 0.75)",
  RUNTIME_ARCHITECTURE: "rgba(90, 255, 180, 0.75)",
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

function endpointId(endpoint: GraphLink["source"] | GraphLink["target"]): RevId | null {
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
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodesById = new Map<RevId, GraphNode>();
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
        nodesById.set(targetId, {
          id: targetId,
          label: targetId,
          degree: 0,
        });
        degreeById.set(targetId, 0);
      }

      const type = l.type ?? "related";

      links.push({ source: sourceId, target: targetId, type });

      degreeById.set(sourceId, (degreeById.get(sourceId) ?? 0) + 1);
      degreeById.set(targetId, (degreeById.get(targetId) ?? 0) + 1);
    }
  }

  const nodes: GraphNode[] = [];
  for (const [id, node] of nodesById.entries()) {
    nodes.push({ ...node, degree: degreeById.get(id) ?? 0 });
  }

  return { nodes, links };
}

function isFGNode3D(node: GraphNode): node is GraphNode & { x: number; y: number; z: number } {
  return (
    typeof node.x === "number" &&
    typeof node.y === "number" &&
    typeof node.z === "number"
  );
}

function getNodeRadius(node: GraphNode, isActive: boolean, isHovered: boolean): number {
  const degree = node.degree ?? 0;

  // Base similar spirit to your previous sizing: small + log degree
  let r = 4 + Math.log1p(degree);

  // Emphasis parity with 2D: active > hovered > background
  if (isActive) r *= 20;
  else if (isHovered) r *= 10;
  else r *= 0.95;

  return r;
}

const MeshTopologyView3D: React.FC<MeshTopologyView3DProps> = ({
  revs,
  activeNodeId,
  hoveredNodeId,
  onSelectNode,
  setHoveredNodeId,
  guidedNextId,
  visibleNodeIds,
  dimensionById,
}) => {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const forcesInitializedRef = useRef(false);

  const cameraDefaultPosRef = useRef<CameraPosition | null>(null);
  const defaultDistanceRef = useRef<number | null>(null);
  const didInitialCenterRef = useRef(false);


  const { nodes: rawNodes, links: rawLinks } = useMemo(
    () => buildGraphFromOnboardingRevs(revs),
    [revs]
  );

  //Frozen Layout state
  const [isLayoutFrozen, setIsLayoutFrozen] = useState<boolean>(false);

  // Visibility filtering (both endpoints visible)
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

  // Directional adjacency sets, computed on *filtered* links (matches 2D)
  const activeOutgoingTargets = useMemo(
    () => buildOutgoingTargets(activeNodeId ?? null, links),
    [activeNodeId, links]
  );

  const hoveredOutgoingTargets = useMemo(
    () => buildOutgoingTargets(hoveredNodeId ?? null, links),
    [hoveredNodeId, links]
  );

  // Preserve camera behavior: center + "zoom" on active
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    // Init default camera once
    if (cameraDefaultPosRef.current === null || defaultDistanceRef.current === null) {
      cameraDefaultPosRef.current = DEFAULT_CAMERA_POSITION;
      defaultDistanceRef.current = Math.sqrt(
        DEFAULT_CAMERA_POSITION.x * DEFAULT_CAMERA_POSITION.x +
          DEFAULT_CAMERA_POSITION.y * DEFAULT_CAMERA_POSITION.y +
          DEFAULT_CAMERA_POSITION.z * DEFAULT_CAMERA_POSITION.z
      );
      graph.cameraPosition(DEFAULT_CAMERA_POSITION);
    }

    const transitionMs = 600;
    const defaultDistance = defaultDistanceRef.current ?? DEFAULT_CAMERA_DISTANCE;
    const selectedDistance = defaultDistance * SELECTED_DISTANCE_MULTIPLIER;

    const targetNode = nodes.find((node) => node.id === activeNodeId);
    if (!targetNode || !isFGNode3D(targetNode)) return;

    const { x, y, z } = targetNode;
    const len = Math.sqrt(x * x + y * y + z * z) || 1;

    const pos: CameraPosition = {
      x: x + (x / len) * selectedDistance,
      y: y + (y / len) * selectedDistance,
      z: z + (z / len) * selectedDistance,
    };

    graph.cameraPosition(pos, { x, y, z }, transitionMs);
  }, [activeNodeId, nodes]);

  // Keep your extra scene light
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const scene = graph.scene();
    const extraLight = new THREE.PointLight("#ffffff", 2, 2000);
    extraLight.position.set(200, 200, 200);
    scene.add(extraLight);
  }, []);

  // Styling predicates (match 2D semantics exactly)
  const isGuidedEdge = (link: GraphLink): boolean => {
    if (!guidedNextId) return false;
    const s = endpointId(link.source);
    const t = endpointId(link.target);
    if (!s || !t) return false;

    // Matches 2D’s current implementation (bidirectional check)
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

  const linkColor = (linkObj: LinkObject): string => {
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

  const linkWidth = (linkObj: LinkObject): number => {
    const link = linkObj as GraphLink;

    if (isGuidedEdge(link)) return 1.3;

    const activeOutgoing = isActiveOutgoingEdge(link);
    const hoverOutgoing = isHoveredOutgoingEdge(link);

    if (activeOutgoing) return 3;
    if (hoverOutgoing) return 2;
    return .75;
  };

  if (!nodes.length) {
    return <div className="mesh-topology-loading">No mesh data.</div>;
  }

  return (
    <div className="mesh-topology-container">
      <ForceGraph3D<GraphNode, GraphLink>
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeId="id"
        cooldownTime={isLayoutFrozen ? 0 : 100}
        onEngineStop={() => {
            const graph = graphRef.current;
            if (!graph) return;

            // Freeze layout (same as before)
            if (!isLayoutFrozen) {
                nodes.forEach((n) => {
                if (
                    typeof n.x === "number" &&
                    typeof n.y === "number" &&
                    typeof n.z === "number"
                ) {
                    n.fx = n.x;
                    n.fy = n.y;
                    n.fz = n.z;
                }
                });
                setIsLayoutFrozen(true);
            }

            // ✅ Initial camera centering once nodes have positions
            if (!didInitialCenterRef.current) {
                const targetNode = nodes.find((n) => n.id === activeNodeId);
                if (targetNode && isFGNode3D(targetNode)) {
                const { x, y, z } = targetNode;
                const len = Math.sqrt(x * x + y * y + z * z) || 1;

                const defaultDistance =
                    defaultDistanceRef.current ?? DEFAULT_CAMERA_DISTANCE;
                const selectedDistance = defaultDistance * SELECTED_DISTANCE_MULTIPLIER;

                const pos = {
                    x: x + (x / len) * selectedDistance,
                    y: y + (y / len) * selectedDistance,
                    z: z + (z / len) * selectedDistance,
                };

                graph.cameraPosition(pos, { x, y, z }, 1000);
                didInitialCenterRef.current = true;
                }
            }
            }}


        nodeLabel={(node) => node.label ?? node.id}
        onEngineTick={() => {
          const graph = graphRef.current;
          if (!graph) return;
          if (forcesInitializedRef.current) return;

          const rawLinkForce = graph.d3Force("link");
          const linkForce = rawLinkForce as ForceWithDistance | undefined;
          if (linkForce) linkForce.distance(400);

          const rawChargeForce = graph.d3Force("charge");
          const chargeForce = rawChargeForce as ForceWithStrength | undefined;
          if (chargeForce) chargeForce.strength(-400);

          graph.d3ReheatSimulation();
          forcesInitializedRef.current = true;
        }}
        // Node emphasis (no icons)
        nodeColor={(node) => {
            const dim = dimensionById.get(node.id);
            const base = dim ? DIMENSION_COLOR[dim] : "rgba(255, 255, 255, 0.45)";

            const isActive = node.id === activeNodeId;
            const isHovered = hoveredNodeId !== null && node.id === hoveredNodeId;

            // Emphasis rules (keep semantics; just visual):
            if (isActive) return withAlpha(base, 1.0);
            if (isHovered) return withAlpha(base, 0.9);
            return withAlpha(base, 0.55);
            }}

        nodeVal={(node) => {
          const isActive = node.id === activeNodeId;
          const isHovered = hoveredNodeId !== null && node.id === hoveredNodeId;
          return getNodeRadius(node, isActive, isHovered);
        }}
        // Link emphasis (outgoing-only + guided priority)
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={0.25}
        linkCurvature={0.25}
        // Controlled interactions
        onNodeHover={(node) => {
          const id = node ? (node as GraphNode).id : null;
          setHoveredNodeId(id);
        }}
        onNodeClick={(node) => {
          const n = node as GraphNode;
          onSelectNode(n.id);
        }}
      />
    </div>
  );
};

export default MeshTopologyView3D;
