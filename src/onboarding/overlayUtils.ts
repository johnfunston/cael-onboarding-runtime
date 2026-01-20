// src/onboarding/overlayUtils.ts
import { NODE_CONFIGS, type NodeId } from "./onboardingConfig";

export function getNodeIndex(id: NodeId): number {
  return NODE_CONFIGS.findIndex((n) => n.id === id);
}

export function getNextNodeId(active: NodeId): NodeId | null {
  const idx = getNodeIndex(active);
  const next = NODE_CONFIGS[idx + 1];
  return next ? next.id : null;
}

export function shouldShowNextHint(active: NodeId): boolean {
  return active !== "axiom" && active !== "json";
}

export function getHintZIndex(active: NodeId): number {
  if (active === "dimensions" || active === "families" || active === "subfamilies") {
    return 30;
  }
  return 15;
}
