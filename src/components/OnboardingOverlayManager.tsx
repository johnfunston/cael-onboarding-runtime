// src/components/OnboardingOverlayManager.tsx
import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { NodeId, ScreenPosMap } from "../onboarding/onboardingConfig";
import {
  getNextNodeId,
  shouldShowNextHint,
  getHintZIndex,
} from "../onboarding/overlayUtils";

import PurposeOverlay from "../onboarding/overlays/PurposeOverlay";

type OnboardingOverlayManagerProps = {
  activeNodeId: NodeId;
  screenPos: ScreenPosMap;
  cameraSettled: boolean;
};

type ScreenPoint = { x: number; y: number };

function RippleHint({
  point,
  zIndex,
  enabled,
}: {
  point: ScreenPoint;
  zIndex: number;
  enabled: boolean;
}): React.ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // If disabled → kill animations + force hidden
    if (!enabled) {
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 0 });
      const rings = Array.from(el.querySelectorAll<HTMLElement>("[data-ring]"));
      rings.forEach((r) => gsap.killTweensOf(r));
      return;
    }

    // Fade container in
    gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: "power2.out" }
    );

    // Continuous ripple animation
    const rings = Array.from(el.querySelectorAll<HTMLElement>("[data-ring]"));
    const tl = gsap.timeline({ repeat: -1 });

    rings.forEach((ring, i) => {
      tl.fromTo(
        ring,
        { opacity: 0, scale: 0.2 },
        {
          opacity: 0.9,
          scale: 1,
          duration: 1.25,
          ease: "power1.out",
        },
        i * 0.28
      ).to(
        ring,
        {
          opacity: 0,
          duration: 0.35,
          ease: "power1.out",
        },
        i * 0.28 + 0.9
      );
    });

    return () => {
      tl.kill();
    };
  }, [enabled]);

  return (
    <div
      style={{
        position: "absolute",
        left: point.x,
        top: point.y,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex,
      }}
    >
      <div
        ref={rootRef}
        style={{
          position: "relative",
          width: 120,
          height: 120,
          opacity: enabled ? 1 : 0,
          willChange: "transform, opacity",
        }}
      >
        <div
          data-ring
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: "1px solid rgb(162, 249, 81, .6)",
          }}
        />
        <div
          data-ring
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: "1px solid rgb(162, 249, 81, .5)",
          }}
        />
        <div
          data-ring
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: "1px solid rgb(162, 249, 81, .4)",
          }}
        />
         <div
          data-ring
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: "1px solid rgb(162, 249, 81, .3)",
          }}
        />
         <div
          data-ring
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: "1px solid rgb(162, 249, 81, .2)",
          }}
        />
         <div
          data-ring
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: "1px solid rgb(162, 249, 81, .1)",
          }}
        />
      </div>
    </div>
  );
}

function ActiveOverlay({
  nodeId,
  anchor,
  visible,
}: {
  nodeId: NodeId;
  anchor: ScreenPoint;
  visible: boolean;
}): React.ReactElement | null {
  switch (nodeId) {
    case "purpose":
      return <PurposeOverlay anchor={anchor} visible={visible} />;
    default:
      return null; // keep others off until we build them
  }
}

export default function OnboardingOverlayManager({
  activeNodeId,
  screenPos,
  cameraSettled,
}: OnboardingOverlayManagerProps): React.ReactElement | null {
  // Gate all overlays until camera is settled.
  if (!cameraSettled) return null;

  const activePoint = screenPos[activeNodeId];
  if (!activePoint) return null;

  const nextNodeId = shouldShowNextHint(activeNodeId)
    ? getNextNodeId(activeNodeId)
    : null;

  const nextPoint = nextNodeId ? screenPos[nextNodeId] : undefined;
  const hintZ = getHintZIndex(activeNodeId);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {/* Next-node hint */}
      {nextPoint ? (
        <RippleHint point={nextPoint} zIndex={hintZ} enabled={cameraSettled} />
      ) : null}

      {/* Active node overlay */}
      <ActiveOverlay
        nodeId={activeNodeId}
        anchor={activePoint}
        visible={cameraSettled}
      />
    </div>
  );
}
