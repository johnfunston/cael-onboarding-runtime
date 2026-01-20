import React from "react";
import type { NodeId, NodeConfig } from "../onboarding/onboardingConfig";
import "./OnboardingSidePanel.css";

type OnboardingSidePanelProps = {
  activeNodeId: NodeId;
  completedNodes: readonly NodeConfig[];
  onJumpToNode: (id: NodeId) => void;
};

export default function OnboardingSidePanel({
  activeNodeId,
  completedNodes,
  onJumpToNode,
}: OnboardingSidePanelProps): React.ReactElement {
  return (
    <aside className="onboarding-side-panel" data-scroll-lock="true">
      <div style={{ opacity: 0.7, marginBottom: 12 }}>Progress</div>

      {completedNodes.map((n) => {
        const isActive = n.id === activeNodeId;

        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onJumpToNode(n.id)}
            disabled={isActive}
            aria-current={isActive ? "step" : undefined}
            className={[
              "onboarding-side-panel-button",
              isActive ? "is-active" : "",
            ].join(" ")}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.label}</div>
            <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.35 }}>
              {n.copy}
            </div>
          </button>
        );
      })}
    </aside>
  );
}
