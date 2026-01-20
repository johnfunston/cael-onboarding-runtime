// src/components/MeshGraphView.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { Rev } from "../lib/revTypes";
import {
  buildGraphFromRevs,
  type GraphNode,
  type FGNode,
  type GraphLink,
} from "../lib/graphTypes";
import './MeshTopologyView.css'

const isFGNode = (node: GraphNode): node is FGNode => {
  const maybe = node as FGNode;
  return typeof maybe.x === "number" && typeof maybe.y === "number";
};


interface MeshTopologyViewProps {
  onSelectRev?: (id: string) => void;
  selectedId: string | null;
  hoveredId: string | null;
}


// Base Zoom

const BASE_DEFAULT_ZOOM = .5;

// ----------------------------------------------------------------------------
// Link styling helpers
// ----------------------------------------------------------------------------

/**
 * Core link types we care about:
 * "axiom",
 * "lemma",
 * "corollary",
 * "prerequisite",
 * "supports",
 * "validates",
 * "governs",
 * "parallel",
 * "contradicts",
 * "informs",
 * "related"
 */

const AXIOM_COLOR = "#BB6830";          // Egyptian Earth
const LEMMA_COLOR = "#7658b2";     // Royal Purple
const CONTRADICTS_COLOR = "#632024"; // Caput Mortuum
const COROLLARY_COLOR = "#86f6f4";          // Flux
const PREREQUISITE_COLOR = "#E0C58F";     // Quicksand
const SUPPORTS_COLOR = "#3d9bb8"; // Geranium
const VALIDATES_COLOR = "#809076";          // Wasabi
const GOVERNS_COLOR = "#284139";     // Emerald
const PARALLEL_COLOR = "#0c8e76"; // Turquoise
const INFORMS_COLOR = "#3C507D";          // Sapphire
const RELATED_COLOR = "#112250";     // Royal Blue


const DEFAULT_LINK_COLOR = "#ffffff"; 

// For convenience, if you don't have GraphLink typed:
type AnyLink = GraphLink | (Record<string, unknown> & { type?: string });

// Groupings by curvature
const STRAIGHT_TYPES = new Set<string>([
  "axiom",
  "lemma",
  "contradicts",
]);

const MID_CURVE_TYPES = new Set<string>([
  "corollary",
  "parallel",
  "related",
]);

const HIGH_CURVE_TYPES = new Set<string>([
  "prerequisite",
  "supports",
  "validates",
  "governs",
  "informs",
]);

function getLinkCurvature(link: AnyLink): number {
  const t = (link.type ?? "").toString();

  if (STRAIGHT_TYPES.has(t)) return 0;       // most direct
  if (MID_CURVE_TYPES.has(t)) return 0.125;    // gentle bend
  if (HIGH_CURVE_TYPES.has(t)) return 0.25;   // more curved

  // Fallback for unknown / legacy
  return 0.15;
}
function addAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getBaseHexForType(link: AnyLink): string {
  const t = (link.type ?? "").toString();

  if (t === "axiom") return AXIOM_COLOR;
  if (t === "lemma") return LEMMA_COLOR;
  if (t === "contradicts") return CONTRADICTS_COLOR;
  if (t === "corollary") return COROLLARY_COLOR;
  if (t === "prerequisite") return PREREQUISITE_COLOR;
  if (t === "supports") return SUPPORTS_COLOR;
  if (t === "validates") return VALIDATES_COLOR;
  if (t === "governs") return GOVERNS_COLOR;
  if (t === "parallel") return PARALLEL_COLOR;
  if (t === "informs") return INFORMS_COLOR;
  if (t === "related") return RELATED_COLOR;

  return DEFAULT_LINK_COLOR;
}

function getLinkColorForGraph(
  link: AnyLink,
  selectedId: string | null,
  hoveredNodeId: string | null
): string {
  const baseHex = getBaseHexForType(link);

  const hasSelection = !!selectedId;
  const hasHover = !!hoveredNodeId;

  // No selection, no hover → global low-opacity colored mesh
  if (!hasSelection && !hasHover) {
    return addAlpha(baseHex, 0.25);
  }

  const touchesSelected =
    selectedId !== null && linkTouchesNode(link, selectedId);
  const touchesHovered =
    hoveredNodeId !== null && linkTouchesNode(link, hoveredNodeId);

  const touchesEither = touchesSelected || touchesHovered;

  if (!touchesEither) {
    // Not attached to selected or hovered → faded, but still visible
    return addAlpha(DEFAULT_LINK_COLOR, 0.05);
  }

  // Edge is attached to either selected or hovered node → full semantic color
  return addAlpha(baseHex, 1);
}

function getNodeRadius(node: GraphNode): number {
  const degree = node.degree ?? 0;
  const lineage = node.lineageRank ?? 0;

  // Base radius
  let r = 4;

  // Grow with degree (logarithmic so big hubs don’t explode)
  r += Math.log1p(degree); // log(1 + degree)

  // Bump for high lineage rank
  if (lineage >= 10) {
    r += 3;
  } else if (lineage >= 7) {
    r += 1.5;
  }

  return r;
}

function linkTouchesNode(link: AnyLink, nodeId: string): boolean {
  if (!nodeId) return false;

  const source = link.source as GraphNode | string | undefined;
  const target = link.target as GraphNode | string | undefined;

  const sourceId = typeof source === "string" ? source : source?.id;
  const targetId = typeof target === "string" ? target : target?.id;

  return sourceId === nodeId || targetId === nodeId;
}

function buildAdjacency(
  nodeId: string | null,
  links: GraphLink[]
) : Set<string> {
  const set = new Set<string>();
  if(!nodeId) return set;

  set.add(nodeId);

  for (const rawLink of links) {
    const link = rawLink as GraphLink;
    const source = link.source as GraphNode | string | undefined;
    const target = link.target as GraphNode | string | undefined;

    const sourceId = typeof source === "string" ? source : source?.id;
    const targetId = typeof target === "string" ? target : target?.id;

    if (!sourceId || !targetId) continue;

    if (sourceId === nodeId || targetId === nodeId) {
      set.add(sourceId);
      set.add(targetId);
    }
  }
  return set;
}

const MeshTopologyView: React.FC<MeshTopologyViewProps> = ({ onSelectRev, selectedId, hoveredId }) => {
  // Consts

  const API_BASE = 'http://localhost:4000';
  const SELECTED_ZOOM_MULTIPLIER = 2;
  // Refs

  const graphRef = useRef<ForceGraphMethods<GraphNode> | undefined>(undefined);
  const defaultZoomRef = useRef<number | null>(null);
  // States

  const [revs, setRevs] = useState<Rev[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(hoveredId);
  const [isLayoutFrozen, setIsLayoutFrozen] = useState(false);

  useEffect(() => {
    setHoveredNodeId(hoveredId);
  }, [hoveredId]);

  useEffect(() => {
    let isMounted = true;

    const fetchRevs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/mesh/topology`); // adjust if your route differs
        if (!res.ok) {
          throw new Error(`Failed to fetch revs: ${res.status}`);
        }
        const data = (await res.json()) as Rev[];

        if (isMounted) {
          setRevs(data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Failed to load mesh data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRevs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Build graph model for full mesh
  const { nodes, links } = useMemo(
    () => buildGraphFromRevs(revs, { dedupeUndirected: true }),
    [revs]
  );
   useEffect(() => {
    if (!graphRef.current) return;
    if (!nodes.length) return;

    const linkForce = graphRef.current.d3Force("link");

    if (linkForce) {
      linkForce.distance(200);
    }
     const chargeForce = graphRef.current.d3Force("charge");
  if (chargeForce) {
    chargeForce.strength(-220); // more negative = more space
  }

  // IMPORTANT: reheat the simulation
  graphRef.current.d3ReheatSimulation();
}, [nodes, links]);

useEffect(() => {
  const graph = graphRef.current;
  if (!graph) return;
  if (!nodes.length) return;

  const transitionMs = 600;

  // Initialize default zoom *only if there is no selection*
  if (defaultZoomRef.current === null) {
    defaultZoomRef.current = BASE_DEFAULT_ZOOM;

    if (!selectedId) {
      // Only apply base zoom when nothing is selected
      graph.zoom(BASE_DEFAULT_ZOOM, transitionMs);
    }
  }

  const defaultZoom = defaultZoomRef.current ?? 1;
  const selectedZoom = defaultZoom * SELECTED_ZOOM_MULTIPLIER;

  // If nothing is selected, don't touch zoom anymore
  if (!selectedId) {
    graph.zoom(BASE_DEFAULT_ZOOM, transitionMs);
    return;
  }

  const targetNode = nodes.find((node) => node.id === selectedId);
  if (!targetNode || !isFGNode(targetNode)) return;

  const { x, y } = targetNode;
  if (typeof x !== "number" || typeof y !== "number") return;

  graph.centerAt(x, y, transitionMs);
  graph.zoom(selectedZoom, transitionMs);
}, [selectedId, nodes]);

  //Memos
  const selectedAdjacency = useMemo(
    ()=> buildAdjacency(selectedId, links),
  [selectedId, links]
  );

  const hoverAdjacency = useMemo(
    ()=> buildAdjacency(hoveredNodeId, links),
    [hoveredNodeId, links]
  );


const isFocusActive = selectedId !== null || hoveredNodeId !==null;


  if (isLoading) {
    return <div className="mesh-topology-loading">Loading mesh…</div>;
  }

  if (error) {
    return <div className="mesh-topology-error">{error}</div>;
  }

  return (
    <div className="mesh-topology-container">
      <ForceGraph2D
      ref={graphRef}
        graphData={{ nodes, links }}
        nodeId="id"
        enableNodeDrag={false}
        linkCurvature={(link) => getLinkCurvature(link as AnyLink)}
        linkColor={(link) => getLinkColorForGraph(link as AnyLink, hoveredNodeId, selectedId)}
        cooldownTime={isLayoutFrozen ? 0 : 1000} //1s settle
        onEngineStop={() => {
          if (isLayoutFrozen) return;

          nodes.forEach((node) => {
            const n = node as FGNode;
            if (typeof n.x === "number" && typeof n.y === "number") {
              n.fx = n.x;
              n.fy = n.y;
            }
          })
          setIsLayoutFrozen(true);
        }}
        onNodeHover={(node) => {
          if (!isLayoutFrozen) return;
          const id = node ? (node as GraphNode).id: null;
          setHoveredNodeId(id);
        }}
         nodeCanvasObject={(node, ctx, globalScale) => {
  const n = node as FGNode;
  const x = n.x;
  const y = n.y;

  if (typeof x !== "number" || typeof y !== "number") return;

  const radius = getNodeRadius(n);
  const baseColor = n.color ?? "#ffffff";

  const isSelected = selectedId !== null && n.id === selectedId;
  const isInSelectedAdjacency = selectedAdjacency.has(n.id);
  const isInHoverAdjacency = hoverAdjacency.has(n.id);
  const isConnectedToFocus = isInSelectedAdjacency || isInHoverAdjacency;

  let nodeHex = baseColor;
  let nodeAlpha = 1;

  if (isFocusActive) {
    if (isSelected) {
      // Selected node: always full color
      nodeHex = baseColor;
      nodeAlpha = 1;
    } else if (isConnectedToFocus) {
      // Adjacent to either selected or hovered node: full color
      nodeHex = baseColor;
      nodeAlpha = 1;
    } else {
      // Not adjacent to either → dim & grayscale
      nodeHex = "#666666";
      nodeAlpha = 0.25;
    }
  } else {
    // No focus: full-color mesh
    nodeHex = baseColor;
    nodeAlpha = 1;
  }

  const fillColor = addAlpha(nodeHex, nodeAlpha);

  // --- Glowing halo for selected node ---
  if (isSelected) {
    const now = Date.now();
    const pulse = 0.7 + 0.3 * Math.sin(now / 250);
    const glowRadius = radius * 4 * pulse;

    const gradient = ctx.createRadialGradient(
      x,
      y,
      radius * 0.4,
      x,
      y,
      glowRadius
    );

    gradient.addColorStop(0, "rgba(253, 182, 2, 0.55)");
    gradient.addColorStop(0.4, "rgba(235, 220, 220, 0.25)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // --- Node circle ---
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = fillColor;
  ctx.fill();

  if ((n.lineageRank ?? 0) >= 8) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.stroke();
  }

  // --- Label ---
  const label = n.label;
  if (label) {
    const fontSize = 10 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let labelAlpha = 0.6;
    if (isFocusActive && !isConnectedToFocus && !isSelected) {
      labelAlpha = 0;
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${labelAlpha})`;
    ctx.fillText(label, x, y - radius - fontSize);
  }
}}

        // Basic label: show the rev title label
        nodeLabel={(node: GraphNode) => node.label}
        // Basic node click: surface the rev id
        onNodeClick={(node) => {
          const n = node as GraphNode;
          if (onSelectRev) {
            onSelectRev(n.id);
          }
        }}
      />
    </div>
    
  );
};



export default MeshTopologyView;
