import React, { useState } from "react";
import { NODE_CONFIGS, type NodeId, type ScreenPosMap } from "../onboarding/onboardingConfig";
import OnboardingMolecule3D from "../components/OnboardingMolecule3D";
import OnboardingSidePanel from "../components/OnboardingSidePanel";
import OnboardingOverlayManager from '../components/OnboardingOverlayManager'

function clampIndex(i: number): number {
  if (i < 0) return 0;
  const max = NODE_CONFIGS.length - 1;
  if (i > max) return max;
  return i;
}

function isFromScrollableRegion(e: WheelEvent): boolean {
  const target = e.target as HTMLElement | null;
  if (!target) return false;
  if (target.closest('[data-scroll-lock="true"]')) return true;

  let el: HTMLElement | null = target;
  while (el) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const isScrollable =
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight;

    if (isScrollable) return true;
    el = el.parentElement;
  }
  return false;
}

function createWheelGate(ms: number) {
  let locked = false;
  return {
    canRun: () => !locked,
    lock: () => {
      locked = true;
      window.setTimeout(() => {
        locked = false;
      }, ms);
    },
  };
}

export default function OnboardingPage(): React.ReactElement {
  const [activeNodeId, setActiveNodeId] = React.useState<NodeId>(NODE_CONFIGS[0].id);
  const [screenPos, setScreenPos] = useState<ScreenPosMap>({});
  const [cameraSettled, setCameraSettled] = useState(false);
  
  React.useEffect(() => {
    const gate = createWheelGate(650);

    const onWheel = (e: WheelEvent): void => {
      if (isFromScrollableRegion(e)) return;

      if (!gate.canRun()) return;
      gate.lock();

      setActiveNodeId((prevId) => {
        setCameraSettled(false)
        const currentIndex = NODE_CONFIGS.findIndex((n) => n.id === prevId);
        if (currentIndex === -1) return prevId;

        const direction = e.deltaY > 0 ? 1 : -1;
        const nextIndex = clampIndex(currentIndex + direction);
        return NODE_CONFIGS[nextIndex].id;
      });
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  const activeNode = React.useMemo(
    () => NODE_CONFIGS.find((n) => n.id === activeNodeId)!,
    [activeNodeId]
  );

  const completedNodes = React.useMemo(() => {
    return NODE_CONFIGS.filter((n) => n.step < activeNode.step);
  }, [activeNode.step]);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <OnboardingMolecule3D
          activeNodeId={activeNodeId}
          onActiveNodeChange={setActiveNodeId}
          onScreenPosChange={setScreenPos}
          onCameraSettledChange={setCameraSettled}
          // gridVisible={true} // if you want to see it
        />
      </div>

      <div data-scroll-lock="true" style={{ width: 420, overflowY: "auto" }}>
        <OnboardingSidePanel
          activeNodeId={activeNodeId}
          completedNodes={completedNodes}
          onJumpToNode={setActiveNodeId}
        />
      </div>
      <div>
        <OnboardingOverlayManager
          activeNodeId={activeNodeId}
          screenPos={screenPos}
          cameraSettled={cameraSettled}
        />
      </div>
    </div>
  );
}
