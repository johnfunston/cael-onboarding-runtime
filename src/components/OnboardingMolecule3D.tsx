// src/components/OnboardingMolecule3D.tsx
import React, { useEffect, useMemo, useRef } from "react";
import ForceGraph3D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-3d";
import {
  WORLD_SIZE,
  CAMERA_PRESETS,
  NODE_CONFIGS,
  LINKS,
  type NodeId,
  type ScreenPosMap,
  type CaelLink,
} from "../onboarding/onboardingConfig";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./OnboardingMolecule3D.css";

type OnboardingMolecule3DProps = {
  activeNodeId: NodeId;
  onActiveNodeChange: (id: NodeId) => void;
  onScreenPosChange?: (map: ScreenPosMap) => void;
  onCameraSettledChange?: (settled: boolean) => void;
  gridVisible?: boolean;
};

function debugGltfMaterials(root: THREE.Object3D): void {
  const seen = new Set<THREE.Material>();

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (!m || seen.has(m)) continue;
      seen.add(m);

      const name = (m as { name?: string }).name ?? "(unnamed)";
      const type = m.type;

      const sm = m as THREE.MeshStandardMaterial;
      const hasPBR =
        m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial;

      console.log("[GLB MAT]", { name, type, hasPBR });

      if (hasPBR) {
        console.log("  maps:", {
          map: !!sm.map,
          normalMap: !!sm.normalMap,
          roughnessMap: !!sm.roughnessMap,
          metalnessMap: !!sm.metalnessMap,
          aoMap: !!sm.aoMap,
          emissiveMap: !!sm.emissiveMap,
        });
        console.log("  values:", {
          color: `#${sm.color.getHexString()}`,
          roughness: sm.roughness,
          metalness: sm.metalness,
          emissive: `#${sm.emissive.getHexString()}`,
          emissiveIntensity: sm.emissiveIntensity,
        });
      }
    }
  });
}


const AXIS_COLORS = {
  x: 0x00ffff,
  y: 0x00ffff,
  z: 0x00ffff,
} as const;

const GRID_OPACITY = 0.1;

// IMPORTANT: these were set to 0 in your file (that makes active nodes invisible)
const NODE_SCALE_ACTIVE = 1.0;
const NODE_SCALE_NEAR = 0.25;
const NODE_SCALE_OTHER = 0.1;

const AXIS_LABEL_OFFSET = 0.45;
const AXIS_LABEL_SCALE = { x: 0.5, y: 0.25, z: 1 } as const;

type ScreenPoint = { x: number; y: number };
type TrackballControlsLike = { noRotate: boolean; noPan: boolean; noZoom: boolean };

type OnboardingNode = {
  id: NodeId;
  label: string;
  copy: string;
  step: number;
  x: number;
  y: number;
  z: number;
  fx: number;
  fy: number;
  fz: number;
  cardOffset: { dx: number; dy: number };
};

function warnIfOutOfBounds(n: { x: number; y: number; z: number }): void {
  const inBounds =
    n.x >= 0 &&
    n.x <= WORLD_SIZE &&
    n.y >= 0 &&
    n.y <= WORLD_SIZE &&
    n.z >= 0 &&
    n.z <= WORLD_SIZE;

  if (!inBounds) console.warn("[Onboarding] Node out of world bounds:", n);
}

function createAxisLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Sprite(new THREE.SpriteMaterial());

  canvas.width = 256;
  canvas.height = 128;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 52px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(AXIS_LABEL_SCALE.x, AXIS_LABEL_SCALE.y, AXIS_LABEL_SCALE.z);
  return sprite;
}

function addAxisLineSegments(
  group: THREE.Group,
  positions: number[],
  colorHex: number
): { geometry: THREE.BufferGeometry; material: THREE.LineBasicMaterial } {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: GRID_OPACITY,
  });

  const lines = new THREE.LineSegments(geometry, material);
  group.add(lines);

  return { geometry, material };
}

export default function OnboardingMolecule3D({
  activeNodeId,
  onActiveNodeChange,
  onScreenPosChange,
  onCameraSettledChange,
  gridVisible = false,
}: OnboardingMolecule3DProps): React.ReactElement {
  const activeNodeConfig = useMemo(() => {
    return NODE_CONFIGS.find((n) => n.id === activeNodeId)!;
  }, [activeNodeId]);

  const step = activeNodeConfig.step;

  const graphRef = useRef<
    | ForceGraphMethods<
        NodeObject<OnboardingNode>,
        LinkObject<OnboardingNode, CaelLink>
      >
    | undefined
  >(undefined);

  // GLB model for purpose node
  const purposeModelRef = useRef<THREE.Object3D | null>(null);
  const [purposeModelReady, setPurposeModelReady] = React.useState(false);

  useEffect(() => {
  const loader = new GLTFLoader();
  loader.load(
    "/assets/Seed-Model-Webp.glb",
    (gltf) => {
      debugGltfMaterials(gltf.scene);

      // --- INSERT HERE ---
      // Counter-flip model because camera.up is inverted
      gltf.scene.rotation.x = Math.PI;

      purposeModelRef.current = gltf.scene;
      setPurposeModelReady(true);
    },
    undefined,
    (err) => console.error("[GLB] Failed to load purpose model", err)
  );
}, [purposeModelReady]);

  const projectNodeToScreen = React.useCallback(
    (node: { x: number; y: number; z: number }): ScreenPoint | null => {
      const graph = graphRef.current;
      if (!graph) return null;

      const camera = graph.camera();
      const renderer = graph.renderer();

      const width = renderer.domElement.clientWidth;
      const height = renderer.domElement.clientHeight;

      const v = new THREE.Vector3(node.x, node.y, node.z).project(camera);
      if (v.z > 1) return null;

      return {
        x: (v.x * 0.5 + 0.5) * width,
        y: (-v.y * 0.5 + 0.5) * height,
      };
    },
    []
  );

  const recomputeScreenPositions = React.useCallback((): void => {
    const next: ScreenPosMap = {};
    for (const n of NODE_CONFIGS) {
      const p = projectNodeToScreen(n);
      if (p) next[n.id] = p;
    }
    onScreenPosChange?.(next);
  }, [onScreenPosChange, projectNodeToScreen]);

  const graphData = useMemo(() => {
    const nodes: OnboardingNode[] = NODE_CONFIGS.map((n) => {
      warnIfOutOfBounds(n);
      return { ...n, fx: n.x, fy: n.y, fz: n.z };
    });

    // materialize mutable objects for the lib
    const links: CaelLink[] = LINKS.map((l) => ({ ...l }));
    return { nodes, links };
  }, []);

  const stepById = useMemo(() => {
    const map: Record<NodeId, number> = {} as Record<NodeId, number>;
    for (const n of NODE_CONFIGS) map[n.id] = n.step;
    return map;
  }, []);

  const visibleLinks = useMemo(() => {
    return LINKS.filter((l) => {
      const s = stepById[l.source];
      const t = stepById[l.target];
      return s <= step && t <= step;
    }).map((l) => ({ ...l }));
  }, [stepById, step]);

  // --- materials / geometry
  const nodeGeometry = useMemo(() => new THREE.SphereGeometry(0.28, 16, 16), []);

  const baseNodeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x0b0b12, // dark body
      emissive: new THREE.Color(0x66ccff),
      emissiveIntensity: 1,
      roughness: 0.35,
      metalness: 0.0,
      transparent: true,
      opacity: 1,
      depthWrite: true,
    });
  }, []);

  // camera transitions + overlay gating
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    onCameraSettledChange?.(false);

    const pose = CAMERA_PRESETS[step] ?? CAMERA_PRESETS[0];
    graph.cameraPosition(pose.position, pose.target, 2000);
    graph.camera().up.set(0, -1, 0);

    const t = window.setTimeout(() => {
      recomputeScreenPositions();
      onCameraSettledChange?.(true);
    }, 2000);

    return () => window.clearTimeout(t);
  }, [step, onCameraSettledChange, recomputeScreenPositions]);

  // keep screen positions updated on resize
  useEffect(() => {
    const onResize = (): void => recomputeScreenPositions();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeScreenPositions]);

  // also refresh once on the next frame after mount
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => recomputeScreenPositions());
    return () => window.cancelAnimationFrame(raf);
  }, [recomputeScreenPositions]);

  // controls lock
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const controls = graph.controls() as unknown as TrackballControlsLike | null;
    if (!controls) return;

    controls.noRotate = true;
    controls.noZoom = true;
  }, []);

  // background only (no bloom/postprocessing)
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const renderer = graph.renderer();
    renderer.setClearColor(0x000000, 1);
    renderer.setClearAlpha(1);

    graph.scene().background = new THREE.Color(0x000000);
  }, []);

  // lights
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const scene = graph.scene();
    const existing = scene.getObjectByName("cael-onboarding-lights");
    if (existing) return;

    const group = new THREE.Group();
    group.name = "cael-onboarding-lights";

    group.add(new THREE.AmbientLight(0xffffff, 0.65));

    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(WORLD_SIZE * 1.2, WORLD_SIZE * 1.4, WORLD_SIZE * 1.2);
    group.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-WORLD_SIZE * 0.8, WORLD_SIZE * 0.6, -WORLD_SIZE * 0.8);
    group.add(fill);

    scene.add(group);
    return () => {
      scene.remove(group);
    };
  }, []);

  const getNodeScale = React.useCallback(
    (nodeId: NodeId): number => {
      const activeIndex = NODE_CONFIGS.findIndex((n) => n.id === activeNodeId);
      const nodeIndex = NODE_CONFIGS.findIndex((n) => n.id === nodeId);

      if (nodeIndex === -1 || activeIndex === -1) return NODE_SCALE_OTHER;
      if (nodeIndex === activeIndex) return NODE_SCALE_ACTIVE;
      if (nodeIndex === activeIndex - 1 || nodeIndex === activeIndex + 1) return NODE_SCALE_NEAR;
      return NODE_SCALE_OTHER;
    },
    [activeNodeId]
  );

  const getNodeVisuals = React.useCallback(
    (nodeId: NodeId): { scale: number; opacity: number; emissiveIntensity: number } => {
      const activeIndex = NODE_CONFIGS.findIndex((n) => n.id === activeNodeId);
      const nodeIndex = NODE_CONFIGS.findIndex((n) => n.id === nodeId);
      const total = NODE_CONFIGS.length;

      const scale = getNodeScale(nodeId);

      if (activeIndex === -1 || nodeIndex === -1) return { scale, opacity: 1, emissiveIntensity: 1 };

      // keep purpose cold (relevant only for sphere fallback)
      const isPurpose = nodeId === "purpose";

      if (nodeIndex <= activeIndex) {
        const isActive = nodeIndex === activeIndex;
        return {
          scale,
          opacity: 1,
          emissiveIntensity: isPurpose ? 0 : isActive ? 3 : 1.0,
        };
      }

      if (nodeIndex === activeIndex + 1) {
        return {
          scale,
          opacity: 1,
          emissiveIntensity: isPurpose ? 0 : 3,
        };
      }

      const remaining = Math.max(1, total - 1 - activeIndex);
      const d = nodeIndex - activeIndex;
      const t = d / remaining;

      const MIN_OPACITY = 0.02;
      const POW = 0.5;
      const opacity = 1 - Math.pow(t, POW) * (1 - MIN_OPACITY);

      const MIN_EMISSIVE = 0.25;
      const emissiveIntensity = isPurpose ? 0 : MIN_EMISSIVE + (1 - Math.pow(t, POW)) * 1.2;

      return { scale, opacity, emissiveIntensity };
    },
    [activeNodeId, getNodeScale]
  );

  // create node objects
  const makeNodeObject = React.useCallback(
    (node: OnboardingNode): THREE.Object3D => {
      // PURPOSE: use GLB if available
      if (node.id === "purpose" && purposeModelRef.current) {
        const model = purposeModelRef.current.clone(true);

        // Normalize scale (depends on export)
        model.scale.setScalar(0.25);

        // Tag root for your traversal logic
        model.userData.nodeId = node.id;
        model.userData.isNodeRoot = true;

        // Tag meshes + enable transparency on their materials
        model.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;

          obj.userData.nodeId = node.id;

          const mats: THREE.Material[] = Array.isArray(obj.material) ? obj.material : [obj.material];

          for (const m of mats) {
            m.transparent = true;
            m.needsUpdate = true;
          }
        });

        // Apply your scale rules to the root
        const v = getNodeVisuals(node.id);
        model.scale.multiplyScalar(v.scale);

        return model;
      }

      // everyone else: spheres
      const mat = baseNodeMaterial.clone();
      const mesh = new THREE.Mesh(nodeGeometry, mat);

      mesh.userData.nodeId = node.id;
      mesh.userData.mat = mat;

      const v = getNodeVisuals(node.id);
      mesh.scale.setScalar(v.scale);

      mat.opacity = v.opacity;

      // keep purpose cold (if it ever falls back to sphere)
      mat.emissiveIntensity = node.id === "purpose" ? 0 : v.emissiveIntensity;

      return mesh;
    },
    [baseNodeMaterial, nodeGeometry, getNodeVisuals]
  );

  // spin the purpose node around Z axis
useEffect(() => {
  const graph = graphRef.current;
  if (!graph) return;

  let raf: number;

  const animate = () => {
    graph.scene().traverse((obj: THREE.Object3D) => {
      if (obj.userData?.isNodeRoot && obj.userData?.nodeId === "purpose") {
        obj.rotation.y += 0.005; // <-- spin speed
      }
    });

    raf = requestAnimationFrame(animate);
  };

  raf = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(raf);
}, []);


  // apply visuals on step change / activeNode change
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    graph.scene().traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      const id = (mesh.userData?.nodeId ?? null) as NodeId | null;
      if (!id) return;

      const v = getNodeVisuals(id);
      mesh.scale.setScalar(v.scale);

      const mat = mesh.userData?.mat as THREE.MeshStandardMaterial | undefined;
      if (!mat) return;

      mat.opacity = v.opacity;

      // keep purpose cold (sphere case)
      mat.emissiveIntensity = id === "purpose" ? 0 : v.emissiveIntensity;

      mat.needsUpdate = true;
    });
  }, [getNodeVisuals]);

  // cleanup created materials (clones)
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    return () => {
      nodeGeometry.dispose();
      baseNodeMaterial.dispose();

      graph.scene().traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        const id = (mesh.userData?.nodeId ?? null) as NodeId | null;
        if (!id) return;

        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat instanceof THREE.Material) mat.dispose();
      });
    };
  }, [nodeGeometry, baseNodeMaterial]);

  const handleNodeClick = (node: OnboardingNode): void => {
    onActiveNodeChange(node.id);
  };

  // ------------------------------
  // Grid Helper useEffect
  // ------------------------------
  useEffect(() => {
    const graph = graphRef.current;
    if (!gridVisible) return;
    if (!graph) return;

    const scene = graph.scene();
    const group = new THREE.Group();
    group.name = "cael-grid-helper";

    const s = WORLD_SIZE;

    const lineDisposables: Array<{
      geometry: THREE.BufferGeometry;
      material: THREE.LineBasicMaterial;
    }> = [];

    {
      const positions: number[] = [];
      for (let y = 0; y <= s; y += 1) {
        for (let z = 0; z <= s; z += 1) {
          positions.push(0, y, z, s, y, z);
        }
      }
      lineDisposables.push(addAxisLineSegments(group, positions, AXIS_COLORS.x));
    }

    {
      const positions: number[] = [];
      for (let x = 0; x <= s; x += 1) {
        for (let z = 0; z <= s; z += 1) {
          positions.push(x, 0, z, x, s, z);
        }
      }
      lineDisposables.push(addAxisLineSegments(group, positions, AXIS_COLORS.y));
    }

    {
      const positions: number[] = [];
      for (let x = 0; x <= s; x += 1) {
        for (let y = 0; y <= s; y += 1) {
          positions.push(x, y, 0, x, y, s);
        }
      }
      lineDisposables.push(addAxisLineSegments(group, positions, AXIS_COLORS.z));
    }

    for (let x = 0; x <= s; x += 1) {
      const label = createAxisLabelSprite(String(x));
      label.position.set(x, -AXIS_LABEL_OFFSET, -AXIS_LABEL_OFFSET);
      group.add(label);
    }

    for (let y = 0; y <= s; y += 1) {
      const label = createAxisLabelSprite(String(y));
      label.position.set(-AXIS_LABEL_OFFSET, y, -AXIS_LABEL_OFFSET);
      group.add(label);
    }

    for (let z = 0; z <= s; z += 1) {
      const label = createAxisLabelSprite(String(z));
      label.position.set(-AXIS_LABEL_OFFSET, -AXIS_LABEL_OFFSET, z);
      group.add(label);
    }

    scene.add(group);

    return () => {
      scene.remove(group);

      for (const d of lineDisposables) {
        d.geometry.dispose();
        d.material.dispose();
      }

      group.traverse((obj: THREE.Object3D) => {
        if (!(obj instanceof THREE.Sprite)) return;
        const mat = obj.material;
        if (mat instanceof THREE.SpriteMaterial) {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        }
      });
    };
  }, [gridVisible]);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* Debug overlay */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          color: "#111",
          zIndex: 50,
          pointerEvents: "none",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        <div>step: {step}</div>
        <div>active: {activeNodeId}</div>
      </div>

      <ForceGraph3D<OnboardingNode, CaelLink>
        ref={graphRef}
        graphData={{ nodes: graphData.nodes, links: visibleLinks }}
        cooldownTime={0}
        onNodeClick={handleNodeClick}
        enableNodeDrag={false}
        nodeThreeObject={makeNodeObject}
        nodeThreeObjectExtend={false}
        nodeRelSize={4}
        linkOpacity={0.35}
      />
    </div>
  );
}
