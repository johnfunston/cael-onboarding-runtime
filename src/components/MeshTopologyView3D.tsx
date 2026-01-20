// src/components/MeshTopologyView3D.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import type { ForceGraphMethods } from "react-force-graph-3d";
import * as THREE from 'three';
import type { Rev } from "../lib/revTypes";
import { dimensionColorMap } from "../styles/dimensionColorMap";
import {
  buildGraphFromRevs,
  type GraphNode,
  type GraphLink,
  type FGNode,
} from "../lib/graphTypes";
import "./MeshTopologyView3D.css";

type ForceWithDistance = {
  distance: (dist: number) => unknown;
};

type ForceWithStrength = {
  strength: (val: number) => unknown;
};

interface MeshGraphView3DProps {
  selectedId: string | null;
  onSelectRev?: (id: string) => void;
}

const DEFAULT_CAMERA_DISTANCE = 4000;

type CameraPosition = {
  x: number;
  y: number;
  z: number;
};

const DEFAULT_CAMERA_POSITION: CameraPosition = {
    x: 0,
    y: 0,
    z: DEFAULT_CAMERA_DISTANCE,
}

const isFGNode3D = (node: GraphNode): node is FGNode & {
  x: number;
  y: number;
  z: number;
} => {
  const maybe = node as FGNode;
  return (
    typeof maybe.x === "number" &&
    typeof maybe.y === "number" &&
    typeof maybe.z === "number"
  );
};

function getEmissiveColor(node: GraphNode): THREE.Color {
  const weights = node.dimensionWeights;
  if (!weights || Object.keys(weights).length === 0) {
    // fallback: use node.color or white
    return new THREE.Color(node.color ?? "#ffffff");
  }

  const entries = Object.entries(weights) as [string, number][];

  let rAcc = 0;
  let gAcc = 0;
  let bAcc = 0;
  let total = 0;

  for (const [dimensionId, weight] of entries) {
    const baseHex = dimensionColorMap[dimensionId];
    if (!baseHex) continue;

    const c = new THREE.Color(baseHex);
    rAcc += c.r * weight;
    gAcc += c.g * weight;
    bAcc += c.b * weight;
    total += weight;
  }

  if (total <= 0) {
    return new THREE.Color(node.color ?? "#ffffff");
  }

  return new THREE.Color(rAcc / total, gAcc / total, bAcc / total);
}


function getNodeRadius(node: GraphNode): number {
  const degree = node.degree ?? 0;
  const lineage = node.lineageRank ?? 0;

  let r = 4;
  r += Math.log1p(degree);

  if (lineage >= 10) {
    r += 3;
  } else if (lineage >= 7) {
    r += 1.5;
  }

  return r;
}

const SELECTED_DISTANCE_MULTIPLIER = 0.5; // 2x "zoom in" = half the distance

const MeshTopologyView3D: React.FC<MeshGraphView3DProps> = ({
  selectedId,
  onSelectRev,
}) => {
  const [revs, setRevs] = useState<Rev[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = "http://localhost:4000";

  const graphRef =
    useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
    const forcesInitializedRef = useRef(false);
  const cameraDefaultPosRef = useRef<CameraPosition | null>(null);
  const defaultDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRevs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/mesh/topology`);
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

  const { nodes, links } = useMemo(
    () => buildGraphFromRevs(revs, { dedupeUndirected: true }),
    [revs]
  );

  // Center + "zoom" (camera distance) on selected node, or reset to default
 useEffect(() => {
  const graph = graphRef.current;
  if (!graph) return;

  // Initialise default camera position + distance once
  if (cameraDefaultPosRef.current === null || defaultDistanceRef.current === null) {
    cameraDefaultPosRef.current = DEFAULT_CAMERA_POSITION;
    defaultDistanceRef.current = Math.sqrt(
      DEFAULT_CAMERA_POSITION.x * DEFAULT_CAMERA_POSITION.x +
        DEFAULT_CAMERA_POSITION.y * DEFAULT_CAMERA_POSITION.y +
        DEFAULT_CAMERA_POSITION.z * DEFAULT_CAMERA_POSITION.z
    );
    // Optionally also set the initial camera on mount:
    graph.cameraPosition(DEFAULT_CAMERA_POSITION);
  }

  const transitionMs = 600;
  const defaultCameraPos = cameraDefaultPosRef.current;
  const defaultDistance = defaultDistanceRef.current ?? DEFAULT_CAMERA_DISTANCE;
  const selectedDistance = defaultDistance * SELECTED_DISTANCE_MULTIPLIER;

  // No selection: return to default camera
  if (!selectedId) {
    if (defaultCameraPos) {
      graph.cameraPosition(defaultCameraPos, undefined, transitionMs);
    }
    return;
  }

  const targetNode = nodes.find((node) => node.id === selectedId);
  if (!targetNode || !isFGNode3D(targetNode)) {
    return;
  }

  const { x, y, z } = targetNode;
  const len = Math.sqrt(x * x + y * y + z * z) || 1;

  const pos: CameraPosition = {
    x: x + (x / len) * selectedDistance,
    y: y + (y / len) * selectedDistance,
    z: z + (z / len) * selectedDistance,
  };

  graph.cameraPosition(pos, { x, y, z }, transitionMs);
}, [selectedId, nodes]);

useEffect(() => {
  const graph = graphRef.current;
  if (!graph) return;

  const scene = graph.scene();

  const extraLight = new THREE.PointLight("#ffffff", 2, 2000);
  extraLight.position.set(200, 200, 200);
  scene.add(extraLight);
}, []);

  if (isLoading) {
    return <div className="mesh-topology-loading">Loading mesh…</div>;
  }

  if (error) {
    return <div className="mesh-topology-error">{error}</div>;
  }

  return (
    <div className="mesh-topology-container">
      <ForceGraph3D
        ref={graphRef}
        graphData={{ nodes, links }}
         onEngineTick={() => {
    const graph = graphRef.current;
    if (!graph) return;
    if (forcesInitializedRef.current) return;

    const rawLinkForce = graph.d3Force("link");
    const linkForce = rawLinkForce as ForceWithDistance | undefined;
    if (linkForce) {
      linkForce.distance(400);
    }

    const rawChargeForce = graph.d3Force("charge");
    const chargeForce = rawChargeForce as ForceWithStrength | undefined;
    if (chargeForce) {
      chargeForce.strength(-400);
    }

    graph.d3ReheatSimulation();
    forcesInitializedRef.current = true;
  }}
        nodeId="id"
        // Color: use node color, highlight selected
        nodeColor={(node: GraphNode) =>
          selectedId && node.id === selectedId
            ? "#ffffff"
            : node.color ?? "#cccccc"
        }
        nodeVal={(node: GraphNode) => getNodeRadius(node)}
        linkColor={() => "rgba(255, 255, 255, .15)"}
        linkOpacity={0.25}
        linkCurvature={.25}
        nodeLabel={(node: GraphNode) => node.id}
        nodeThreeObject={(node: GraphNode) => {
               const isSelected = selectedId !== null && node.id === selectedId;
    if (!isSelected) return null;

    const radius = getNodeRadius(node) * 3; // halo bigger than core

    const baseColor = new THREE.Color(node.color ?? "#ffffff");
    const emissiveColor = getEmissiveColor(node);

    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity: 1.5, // tweak this for glow strength
      metalness: 0.0,
      roughness: 0.35,
    });

    const geometry = new THREE.SphereGeometry(radius, 24, 24);

    return new THREE.Mesh(geometry, material);
  }}
  nodeThreeObjectExtend={false}
        onNodeClick={(node: GraphNode) => {
          const n = node as GraphNode;
          if (onSelectRev) {
            onSelectRev(n.id);
          }
        }}
      />
    </div>
  );
};

export default MeshTopologyView3D;
