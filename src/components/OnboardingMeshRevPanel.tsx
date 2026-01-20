// src/components/OnboardingRevPanel.tsx
import React, { useState } from "react";
import OnboardingMeshDNAView, { type OnboardingRev } from "./OnboardingMeshDNAView";
import "./OnboardingMeshRevPanel.css";

type RevId = string;

interface OnboardingMeshRevPanelProps {
  rev: OnboardingRev | null;
  onSelectRev?: (id: RevId) => void;
  onHoverTargetId?: (id: RevId | null) => void;
}



const OnboardingMeshRevPanel: React.FC<OnboardingMeshRevPanelProps> = ({
  rev,
  onSelectRev,
  onHoverTargetId,
}) => {
  const [viewMode, setViewMode] = useState<"content" | "dna">("content");

  if (!rev) {
    return <div className="empty-panel">?.rev</div>;
  }

  const toggleViewMode = (): void => {
    setViewMode((m) => (m === "content" ? "dna" : "content"));
  };

  const lineageRank = rev.metadata?.lineageRank;

  return (
    <div className="rev-detail">
      <div className="rev-panel-title-bar">
        <h1 className="rev-panel-title">{rev.title ?? rev.id}</h1>

        <button
          type="button"
          onClick={toggleViewMode}
          className={viewMode === "dna" ? "dna-button-selected" : "dna-button"}
        >
          {viewMode === "dna" ? "Content" : "Links & Categories"}
        </button>
      </div>
      <div className="rev-panel-id-bar">
        <div className="id-container"><span className='id-tag'>id: </span>{rev.id}</div>
        <div className="lineage-rank-container">Lineage Rank: {lineageRank}</div>
      </div>
      {viewMode === "content" ? (
        <div className="rev-content-view">
          {rev.axiom ? (
            <blockquote className="rev-panel-axiom">
              <span className="axiom-quotations">"</span>
              {rev.axiom}
              <span className="axiom-quotations">"</span>
            </blockquote>
          ) : null}

          {rev.purpose ? (
            <p className="rev-panel-body">
              <span className="content-field-title">
                Purpose
                <br />
              </span>
              {rev.purpose}
            </p>
          ) : null}

          {rev.seedEvent ? (
            <p className="rev-panel-body">
              <span className="content-field-title">
                Seed Event
                <br />
              </span>
              {rev.seedEvent}
            </p>
          ) : null}

          {rev.body ? (
            <p className="rev-panel-body">
              <span className="content-field-title">
                Body
                <br />
              </span>
              {rev.body}
            </p>
          ) : null}

          {/* If everything is missing, show a friendly placeholder */}
          {!rev.axiom && !rev.purpose && !rev.seedEvent && !rev.body ? (
            <p className="dna-empty">No content fields present for this rev.</p>
          ) : null}
        </div>
      ) : (
        <OnboardingMeshDNAView
          rev={rev}
          onSelectRev={onSelectRev}
          onHoverTargetId={onHoverTargetId}
        />
      )}
    </div>
  );
};

export default OnboardingMeshRevPanel;
