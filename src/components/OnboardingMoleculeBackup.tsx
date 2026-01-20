// // src/pages/Onboarding.tsx
// import React, { useEffect, useMemo, useRef } from "react";
// import ForceGraph3D, {
//   type ForceGraphMethods,
//   type LinkObject,
//   type NodeObject,
// } from "react-force-graph-3d";
// import * as THREE from "three";
// import './OnboardingMolecule3D.css';

// // ------------------------------
// // Grid Helper (12×12×12)
// // Axis-colored gridlines:
// //   X lines = green
// //   Y lines = blue
// //   Z lines = red
// // Axis tick labels: 0..12 on each axis
// // ------------------------------

// const AXIS_COLORS = {
//   x: 0x00ffff, // green
//   y: 0x00ffff, // blue
//   z: 0x00ffff, // red
// } as const;

// const GRID_OPACITY = 0.1;

// const NODE_SCALE_ACTIVE = 1.0;   // largest
// const NODE_SCALE_NEAR = 0.50;    // half-ish
// const NODE_SCALE_OTHER = 0.25;   // smallest

// const AXIS_LABEL_OFFSET = 0.45;
// const AXIS_LABEL_SCALE = { x: 0.5, y: 0.25, z: 1 } as const;

// function createAxisLabelSprite(text: string): THREE.Sprite {
//   const canvas = document.createElement("canvas");
//   const ctx = canvas.getContext("2d");

//   // Safe fallback if canvas context isn't available
//   if (!ctx) {
//     return new THREE.Sprite(new THREE.SpriteMaterial());
//   }

//   canvas.width = 256;
//   canvas.height = 128;

//   ctx.clearRect(0, 0, canvas.width/2, canvas.height/2);

//   // Subtle backing for readability
//   ctx.fillStyle = "rgba(0,0,0,0.45)";
//   ctx.fillRect(0, 0, canvas.width, canvas.height);

//   ctx.font = "bold 52px monospace";
//   ctx.fillStyle = "#ffffff";
//   ctx.textAlign = "center";
//   ctx.textBaseline = "middle";
//   ctx.fillText(text, canvas.width, canvas.height);

//   const texture = new THREE.CanvasTexture(canvas);
//   texture.needsUpdate = true;

//   const material = new THREE.SpriteMaterial({
//     map: texture,
//     transparent: true,
//     depthTest: false,
//     depthWrite: false,
//   });

//   const sprite = new THREE.Sprite(material);
//   sprite.scale.set(AXIS_LABEL_SCALE.x, AXIS_LABEL_SCALE.y, AXIS_LABEL_SCALE.z);

//   return sprite;
// }

// function addAxisLineSegments(
//   group: THREE.Group,
//   positions: number[],
//   colorHex: number
// ): { geometry: THREE.BufferGeometry; material: THREE.LineBasicMaterial } {
//   const geometry = new THREE.BufferGeometry();
//   geometry.setAttribute(
//     "position",
//     new THREE.Float32BufferAttribute(positions, 3)
//   );

//   const material = new THREE.LineBasicMaterial({
//     color: new THREE.Color(colorHex),
//     transparent: true,
//     opacity: GRID_OPACITY,
//   });

//   const lines = new THREE.LineSegments(geometry, material);
//   group.add(lines);

//   return { geometry, material };
// }


// const WORLD_SIZE = 12;

// const WORLD_CENTER = {
//   x: WORLD_SIZE / 2,
//   y: WORLD_SIZE / 2,
//   z: WORLD_SIZE / 2,
// } as const;

// type TrackballControlsLike = {
//   noRotate: boolean;
//   noPan: boolean;
//   noZoom: boolean;
// };

// type ControlsChangeLike = {
//   addEventListener: (type: "change" | "end", listener: () => void) => void;
//   removeEventListener: (type: "change" | "end", listener: () => void) => void;
// };


// type WorldPointNode = {
//   id: NodeId;
//   x: number;
//   y: number;
//   z: number;
// };


// type CameraPose = {
//   position: { x: number; y: number; z: number };
//   target: { x: number; y: number; z: number };
// };

// const CAMERA_PRESETS: CameraPose[] = [
//   // step 0 — purpose (6,6,2)
//   { position: { x: 6.8, y: 6.8, z: -11 }, target: { x: 6, y: 6, z: 2 } },

//   // step 1 — seed (8,3,3)
//   { position: { x: 11, y: -14, z: -6 }, target: { x: 8, y: 4, z: 3 } },

//   // step 2 — body (4,1,4)
//   { position: { x: -6, y: -14, z: 0 }, target: { x: 4, y: 1, z: 4 } },

//   // step 3 — categories (2,8,6)
//   { position: { x: -14, y: 14, z: 10 }, target: { x: 2, y: 8, z: 6 } },

//   // step 4 — taxonomy (4,9,6)
//   { position: { x: 4.8, y: 9.8, z: -11 }, target: { x: 4, y: 9, z: 6 } },

//   // step 5 — dimensions (5,10,5)
//   { position: { x: -6, y: 10, z: -11 }, target: { x: 5, y: 10, z: 5 } },

//   // step 6 — families (4,11,4)
//   { position: { x: 4.8, y: 11.8, z: -11 }, target: { x: 4, y: 11, z: 4 } },

//   // step 7 — subfamilies (3,12,3)
//   { position: { x: 6, y: 12.8, z: -6 }, target: { x: 3, y: 12, z: 3 } },

//   // step 8 — links (4,6,6)
//   { position: { x: -12, y: 6.8, z: 15 }, target: { x: 4, y: 6, z: 6 } },

//   // step 9 — tags (4,6,9)  (slightly closer)
//   { position: { x: -6, y: 0, z: 18 }, target: { x: 8, y: 6, z: 6 } },

//   // step 10 — lemmas (4,7,8) (slightly closer)
//   { position: { x: -4, y: 6, z: 13 }, target: { x: 12, y: 6, z: 4 } },

//   // step 11 — axiom (3,4,6)
//   { position: { x: -15, y: -15, z: -15 }, target: { x: 0, y: 6, z: 0 } },
// ];

// // Canonical structure preserved (only x/y/z manually assigned)
// const NODE_CONFIGS = [
//   {
//     id: "purpose",
//     label: "Purpose",
//     copy: "Cael is a cognitive ecosystem.",
//     x: 6,
//     y: 6,
//     z: 2,
//     step: 0,
//     cardOffset: { dx: 50, dy: 100},
//   },
//   {
//     id: "seed",
//     label: "Seed Event",
//     copy: "Users create documents within that ecosystem.",
//     x: 8,
//     y: 3,
//     z: 3,
//     step: 1,
//     cardOffset: { dx: 60, dy: 25 },
//   },
//   {
//     id: "body",
//     label: "Body",
//     copy:
//       "Documents record insights, discoveries, personal events, or anything worth revisiting.",
//     x: 4,
//     y: 1,
//     z: 4,
//     step: 2,
//     cardOffset: { dx: -360, dy: 0 },
//   },
//   {
//     id: "categories",
//     label: "Categories",
//     copy:
//       "Documents are cross-linked through different relationship types and meanings.",
//     x: 2,
//     y: 8,
//     z: 6,
//     step: 3,
//     cardOffset: { dx: -360, dy: 0, dz: 0 },
//   },
//   {
//     id: "taxonomy",
//     label: "Taxonomy",
//     copy:
//       "Documents are categorized using dimensions, families, and subfamilies.",
//     x: 4,
//     y: 9,
//     z: 6,
//     step: 4,
//     cardOffset: { dx: 60, dy: -25 },
//   },
//   {
//     id: "dimensions",
//     label: "Dimensions",
//     copy: "High-level axes: emotional architecture, recursion logic, etc.",
//     x: 5,
//     y: 10,
//     z: 5,
//     step: 5,
//     cardOffset: { dx: 60, dy: 0 },
//   },
//   {
//     id: "families",
//     label: "Families",
//     copy: "Mid-level groupings that cluster related revs.",
//     x: 4,
//     y: 11,
//     z: 4,
//     step: 6,
//     cardOffset: { dx: -360, dy: 15, dz: 0 },
//   },
//   {
//     id: "subfamilies",
//     label: "Subfamilies",
//     copy: "Fine-grained categories for precise placement.",
//     x: 3,
//     y: 12,
//     z: 3,
//     step: 7,
//     cardOffset: { dx: 60, dy: 20, dz: 0 },
//   },
//   {
//     id: "links",
//     label: "Links",
//     copy: "Direct navigation between thoughts—insight isn’t always sequential.",
//     x: 4,
//     y: 6,
//     z: 6,
//     step: 8,
//     cardOffset: { dx: -300, dy: -75 },
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     copy: "Keywords for fast recall and semantic search.",
//     x: 4,
//     y: 6,
//     z: 9,
//     step: 9,
//     cardOffset: { dx: -360, dy: 10 },
//   },
//   {
//     id: "lemmas",
//     label: "Lemmas",
//     copy:
//       "Some revs aren’t just related—they’re dependencies required for others.",
//     x: 4,
//     y: 7,
//     z: 8,
//     step: 10,
//     cardOffset: { dx: -360, dy: 30 },
//   },
//   {
//     id: "axiom",
//     label: "Axiom",
//     copy:
//       "A distilled rule-of-thumb derived from purpose + seed + body: the cement of insight.",
//     x: 3,
//     y: 4,
//     z: 6,
//     step: 11,
//     cardOffset: { dx: -300, dy: -80 },
//   },
// ] as const;

// type NodeId = (typeof NODE_CONFIGS)[number]["id"];

// type CaelLinkKind = "line" | "arc";

// type CaelLink = {
//   source: NodeId;
//   target: NodeId;
//   kind?: CaelLinkKind;
// };

// // Canonical spec; keep `as const` here if you want,
// // but DO NOT pass readonly arrays into the graphData prop.
// const LINKS = [
//   { source: "purpose", target: "seed" },
//   { source: "seed", target: "body" },
//   { source: "body", target: "categories" },

//   { source: "categories", target: "taxonomy" },
//   { source: "categories", target: "links" },

//   { source: "taxonomy", target: "dimensions" },
//   { source: "dimensions", target: "families" },
//   { source: "families", target: "subfamilies" },

//    { source: "taxonomy", target: "dimensions", kind: "arc" },
//   { source: "taxonomy", target: "families", kind: "arc" },
//   { source: "taxonomy", target: "subfamilies", kind: "arc" },

//   { source: "links", target: "tags" },
//   { source: "links", target: "lemmas" },

//   { source: "purpose", target: "axiom", kind: "arc" },
//   { source: "seed", target: "axiom", kind: "arc" },
//   { source: "body", target: "axiom", kind: "arc" },

// ] satisfies CaelLink[];

// type OnboardingNode = {
//   id: NodeId;
//   label: string;
//   copy: string;
//   step: number;
//   x: number;
//   y: number;
//   z: number;
//   fx: number;
//   fy: number;
//   fz: number;
//   cardOffset: { dx: number; dy: number };
// };

// function warnIfOutOfBounds(n: { x: number; y: number; z: number }): void {
//   const inBounds =
//     n.x >= 0 &&
//     n.x <= WORLD_SIZE &&
//     n.y >= 0 &&
//     n.y <= WORLD_SIZE &&
//     n.z >= 0 &&
//     n.z <= WORLD_SIZE;

//   if (!inBounds) {
     
//     console.warn("[Onboarding] Node out of world bounds:", n);
//   }
// }

// export default function Onboarding(): React.ReactElement {
// const [activeNodeId, setActiveNodeId] = React.useState<NodeId>(
//   NODE_CONFIGS[0].id
// );
// type ScreenPoint = { x: number; y: number };
// type ScreenPosMap = Partial<Record<NodeId, ScreenPoint>>;

// const [screenPos, setScreenPos] = React.useState<ScreenPosMap>({});
// const [gridVisible, setGridVisible] = React.useState<boolean>(false);


// const activeNodeConfig = useMemo(() => {
//   return NODE_CONFIGS.find((n) => n.id === activeNodeId)!;
// }, [activeNodeId]);

// const step = activeNodeConfig.step

//   // Ref uses wrapper types; graphData uses plain domain types.
//   const graphRef = useRef<
//     | ForceGraphMethods<NodeObject<OnboardingNode>, LinkObject<OnboardingNode, CaelLink>>
//     | undefined
//   >(undefined);

//   const scrollLockRef = useRef(false);

//   const graphData = useMemo(() => {
//     const nodes: OnboardingNode[] = NODE_CONFIGS.map((n) => {
//       warnIfOutOfBounds(n);
//       return { ...n, fx: n.x, fy: n.y, fz: n.z };
//     });

//     // Materialize as mutable arrays (library expects mutable)
//     const links: CaelLink[] = LINKS.map((l) => ({ ...l }));

//     return { nodes, links };
//   }, []);

// const stepById = useMemo(() => {
//   const map: Record<NodeId, number> = {} as Record<NodeId, number>;
//   for (const n of NODE_CONFIGS) map[n.id] = n.step;
//   return map;
// }, []);


// const visibleLinks = useMemo(() => {
//   return LINKS.filter((l) => {
//     const s = stepById[l.source];
//     const t = stepById[l.target];
//     return s <= step && t <= step;
//   }).map((l) => ({ ...l })); // materialize as mutable objects
// }, [stepById, step]);


//   const projectNodeToScreen = React.useCallback(
//   (node: WorldPointNode): ScreenPoint | null => {
//     const graph = graphRef.current;
//     if (!graph) return null;

//     const camera = graph.camera();
//     const renderer = graph.renderer();

//     const width = renderer.domElement.clientWidth;
//     const height = renderer.domElement.clientHeight;

//     // project world -> NDC (-1..1)
//     const v = new THREE.Vector3(node.x, node.y, node.z).project(camera);

//     // if behind the camera, skip
//     if (v.z > 1) return null;

//     // NDC -> screen
//     return {
//       x: (v.x * 0.5 + 0.5) * width,
//       y: (-v.y * 0.5 + 0.5) * height,
//     };
//   },
//   []
// );

// const recomputeScreenPositions = React.useCallback(() => {
//   const next: ScreenPosMap = {};
//   for (const n of NODE_CONFIGS) {
//     const p = projectNodeToScreen(n);
//     if (p) next[n.id] = p;
//   }
//   setScreenPos(next);
// }, [projectNodeToScreen]);


//   const nodeGeometry = useMemo(() => new THREE.SphereGeometry(0.28, 16, 16), []);
//   const nodeMaterial = useMemo(
//     () => new THREE.MeshBasicMaterial({ color: 0xffffff }),
//     []
//   );

//   useEffect(() => {
//     const graph = graphRef.current;
//     if (!graph) return;

//     const pose = CAMERA_PRESETS[step] ?? CAMERA_PRESETS[0]

//     graph.cameraPosition(pose.position, pose.target, 2500);

//     graph.camera().up.set(0, -1, 0);
// window.setTimeout(() => {
//   recomputeScreenPositions();
// }, 2500);
//     void WORLD_CENTER;
//   }, [recomputeScreenPositions, step]);

//   useEffect(() => {
//     return () => {
//       nodeGeometry.dispose();
//       nodeMaterial.dispose();
//     };
//   }, [nodeGeometry, nodeMaterial]);

//   const handleNodeClick = (node: OnboardingNode): void => {
//   setActiveNodeId(node.id);
// };

// const clampStep = (nextStep: number): number => {
//   if (nextStep < 0) return 0;
//   if (nextStep >= NODE_CONFIGS.length) return NODE_CONFIGS.length - 1;
//   return nextStep;
// };

// useEffect(() => {
//   const onWheel = (e: WheelEvent): void => {
//     if (scrollLockRef.current) return;

//     scrollLockRef.current = true;

//     setActiveNodeId((prevId) => {
//       const currentIndex = NODE_CONFIGS.findIndex(
//         (n) => n.id === prevId
//       );

//       if (currentIndex === -1) return prevId;

//       const direction = e.deltaY > 0 ? 1 : -1;
//       const nextIndex = clampStep(currentIndex + direction);

//       return NODE_CONFIGS[nextIndex].id;
//     });

//     // release lock after 500ms
//     window.setTimeout(() => {
//       scrollLockRef.current = false;
//     }, 1500);
//   };

//   window.addEventListener("wheel", onWheel, { passive: true });

//   return () => {
//     window.removeEventListener("wheel", onWheel);
//   };
// }, []);

// useEffect(() => {
//   const graph = graphRef.current;
//   if (!graph) return;

//   const controls = graph.controls() as unknown as TrackballControlsLike | null;
//   if (!controls) return;

//   controls.noRotate = true;
//   controls.noZoom = true;
// }, []);

// useEffect(() => {
//   const graph = graphRef.current;
//   if (!graph) return;

//   const controls = graph.controls() as unknown as ControlsChangeLike | null;
//   if (!controls) return;

//   const onChange = (): void => {
//     recomputeScreenPositions();
//   };

//   controls.addEventListener("change", onChange);
//   controls.addEventListener("end", onChange);

//   // initial compute: schedule it (don’t call setState synchronously in effect body)
//   let raf = 0;
//   raf = window.requestAnimationFrame(() => {
//     recomputeScreenPositions();
//   });

//   return () => {
//     controls.removeEventListener("change", onChange);
//     controls.removeEventListener("end", onChange);
//     window.cancelAnimationFrame(raf);
//   };
// }, [recomputeScreenPositions]);

// useEffect(() => {
//   const onResize = (): void => {
//     recomputeScreenPositions();
//   };

//   window.addEventListener("resize", onResize);
//   return () => window.removeEventListener("resize", onResize);
// }, [recomputeScreenPositions]);

// const getNodeScale = React.useCallback(
//   (nodeId: NodeId): number => {
//     const activeIndex = NODE_CONFIGS.findIndex((n) => n.id === activeNodeId);
//     const nodeIndex = NODE_CONFIGS.findIndex((n) => n.id === nodeId);
//     if (activeNodeId === "axiom") {
//       if(nodeIndex === activeIndex) return NODE_SCALE_ACTIVE;
//         return NODE_SCALE_NEAR;
//     } 
//     if (nodeIndex === -1 || activeIndex === -1) return NODE_SCALE_OTHER;
//     if (nodeIndex === activeIndex) return NODE_SCALE_ACTIVE;
//     if (nodeIndex === activeIndex - 1 || nodeIndex === activeIndex + 1)
//       return NODE_SCALE_NEAR;

//     return NODE_SCALE_OTHER;
//   },
//   [activeNodeId]
// );


// useEffect(() => {
//   const graph = graphRef.current;
//   if (!graph) return;

//   graph.scene().traverse((obj: THREE.Object3D) => {
//     const mesh = obj as THREE.Mesh;
//     const id = (mesh.userData?.nodeId ?? null) as NodeId | null;
//     if (!id) return;

//     const s = getNodeScale(id);
//     mesh.scale.setScalar(s);
//   });
// }, [getNodeScale]);



// // ------------------------------
// // Complete Grid Helper useEffect
// // ------------------------------
// useEffect(() => {
//   const graph = graphRef.current;
//   if (!gridVisible) return;
//   if (!graph) return;

//   const scene = graph.scene();
//   const group = new THREE.Group();
//   group.name = "cael-grid-helper";

//   const s = WORLD_SIZE;

//   // Track disposables created in this effect
//   const lineDisposables: Array<{
//     geometry: THREE.BufferGeometry;
//     material: THREE.LineBasicMaterial;
//   }> = [];

//   // --- X axis gridlines (green): lines along X at each (y,z)
//   {
//     const positions: number[] = [];
//     for (let y = 0; y <= s; y += 1) {
//       for (let z = 0; z <= s; z += 1) {
//         positions.push(0, y, z, s, y, z);
//       }
//     }
//     lineDisposables.push(
//       addAxisLineSegments(group, positions, AXIS_COLORS.x)
//     );
//   }

//   // --- Y axis gridlines (blue): lines along Y at each (x,z)
//   {
//     const positions: number[] = [];
//     for (let x = 0; x <= s; x += 1) {
//       for (let z = 0; z <= s; z += 1) {
//         positions.push(x, 0, z, x, s, z);
//       }
//     }
//     lineDisposables.push(
//       addAxisLineSegments(group, positions, AXIS_COLORS.y)
//     );
//   }

//   // --- Z axis gridlines (red): lines along Z at each (x,y)
//   {
//     const positions: number[] = [];
//     for (let x = 0; x <= s; x += 1) {
//       for (let y = 0; y <= s; y += 1) {
//         positions.push(x, y, 0, x, y, s);
//       }
//     }
//     lineDisposables.push(
//       addAxisLineSegments(group, positions, AXIS_COLORS.z)
//     );
//   }

//   // --- Axis tick labels (0..12)
//   // Place them just outside the cube near the origin corner for readability.

//   // X axis: (x, -off, -off)
//   for (let x = 0; x <= s; x += 1) {
//     const label = createAxisLabelSprite(String(x));
//     label.position.set(x, -AXIS_LABEL_OFFSET, -AXIS_LABEL_OFFSET);
//     group.add(label);
//   }

//   // Y axis: (-off, y, -off)
//   for (let y = 0; y <= s; y += 1) {
//     const label = createAxisLabelSprite(String(y));
//     label.position.set(-AXIS_LABEL_OFFSET, y, -AXIS_LABEL_OFFSET);
//     group.add(label);
//   }

//   // Z axis: (-off, -off, z)
//   for (let z = 0; z <= s; z += 1) {
//     const label = createAxisLabelSprite(String(z));
//     label.position.set(-AXIS_LABEL_OFFSET, -AXIS_LABEL_OFFSET, z);
//     group.add(label);
//   }

//   // Add to scene
//   scene.add(group);

//   return () => {
//     scene.remove(group);

//     // Dispose line geometries/materials
//     for (const d of lineDisposables) {
//       d.geometry.dispose();
//       d.material.dispose();
//     }

//     // Dispose sprite textures/materials
//     group.traverse((obj: THREE.Object3D) => {
//       if (!(obj instanceof THREE.Sprite)) return;

//       const mat = obj.material;
//       if (mat instanceof THREE.SpriteMaterial) {
//         if (mat.map) mat.map.dispose();
//         mat.dispose();
//       }
//     });
//   };
// }, []);




//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "100vw",
//         height: "100vh",
//         overflow: "hidden",
//         background: "#050509",
//       }}
//     >
//       <div style={{
//         color: 'white'
//       }}>{step}</div>
//       <div style={{
//         color: 'white'
//       }}>{activeNodeId}</div>
//       <ForceGraph3D<OnboardingNode, CaelLink>
//         ref={graphRef}
//         graphData={{ nodes: graphData.nodes, links: visibleLinks }}
//         cooldownTime={0}
//         onNodeClick={handleNodeClick}
//         enableNodeDrag={false}
//         nodeThreeObject={(node: OnboardingNode) => {
//   const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
//   mesh.userData.nodeId = node.id;

//   const s = getNodeScale(node.id);
//   mesh.scale.setScalar(s);

//   return mesh;
// }}

//         nodeThreeObjectExtend={false}
//         nodeRelSize={4}
//         linkOpacity={0.35}
//       />
//       {(() => {
//   const n = graphData.nodes.find((n) => n.id === activeNodeId);
//   if (!n) return null;
//   if (n.step > step) return null; // safety gate, though redundant

//   const p = screenPos[n.id];
//   if (!p) return null;

//   const offset = n.cardOffset;

//   return (
//     <div
//       key={n.id}
//       className="onboarding-node-card"
//       style={{
//         left: p.x,
//         top: p.y,
//         transform: `translate(${offset.dx}px, ${offset.dy}px)`,
//         position: "absolute",
//       }}
//     >
//       <div className="onboarding-node-card-title">{n.label}</div>
//       <div className="onboarding-node-card-copy">{n.copy}</div>
//     </div>
//   );
// })()}
//     </div>
//   );
// }
