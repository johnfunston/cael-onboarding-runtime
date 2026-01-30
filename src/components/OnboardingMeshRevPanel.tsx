// src/components/OnboardingRevPanel.tsx
import React, { useState } from "react";
import OnboardingMeshDNAView, { type OnboardingRev } from "./OnboardingMeshDNAView";
import "./OnboardingMeshRevPanel.css";

type RevId = string;



interface OnboardingMeshRevPanelProps {
  rev: OnboardingRev | null;
  onSelectRev?: (id: RevId) => void;
  onHoverTargetId?: (id: RevId | null) => void;
  dimensionById: Map<RevId, DimensionKey>;
  taxonomy?: RevTaxonomy | null;
}

export type RevTaxonomy = {
  dimensions?: string[];
  families?: string[];
  subfamilies?: string[];
};

export type DimensionKey =
  | "GENESIS"
  | "FOUNDATIONS"
  | "UNITS"
  | "RELATIONSHIPS"
  | "STRUCTURE"
  | "TRAVERSAL_AND_NAVIGATION"
  | "EVALUATION"
  | "RUNTIME_AND_USAGE"
  | "OUTCOMES";

  const DIMENSION_COLOR: Record<DimensionKey, string> = {
    GENESIS: "rgba(238, 246, 89, 0.95)",
    FOUNDATIONS: "rgba(255, 255, 255, .9)",
  UNITS: "rgba(255, 140, 140, 0.9)",
  RELATIONSHIPS: "rgba(180, 140, 255, 0.9)",
  STRUCTURE: "rgba(120, 200, 255, 0.9)",
  TRAVERSAL_AND_NAVIGATION: "rgba(255, 180, 90, 0.9)",
  EVALUATION: "rgba(90, 255, 180, 0.9)",
  RUNTIME_AND_USAGE: "rgba(255, 255, 255, 0.75)",
  OUTCOMES: "rgba(255, 215, 90, 0.9)",
  };

const OnboardingMeshRevPanel: React.FC<OnboardingMeshRevPanelProps> = ({
  rev,
  onSelectRev,
  onHoverTargetId,
  dimensionById,
  taxonomy,
}) => {
  const [viewMode, setViewMode] = useState<"content" | "dna">("content");

  if (!rev) {
    return <div className="empty-panel">?.rev</div>;
  }

  const dimension = dimensionById.get(rev.id) ?? "";
  const dimensionColor = dimension ? DIMENSION_COLOR[dimension] : "rgba(255, 255, 255, 1)";

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
      <div className="rev-dimension-type-bar">
        <div className="dimension-type-container" style={{color: `${dimensionColor}`}}><span className='dimension-type-tag'>type: </span>{dimension.replaceAll("_", " ").toLowerCase()}</div>
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
  <div className="rev-panel-body">
    <span className="content-field-title">
      Body
      <br />
    </span>

              {rev.body.split("\n\n").map((paragraph, pIndex) => (
                <div key={pIndex} style={{ marginBottom: "0.75rem" }}>
                  {paragraph.split("\n").map((line, lIndex) => {
                    // Bullet detection
                    if (line.startsWith("• ")) {
                      return (
                        <div key={lIndex} style={{ marginLeft: "1rem" }}>
                          • {line.slice(2)}
                        </div>
                      );
                    }

                    // Normal line
                    return (
                      <div key={lIndex}>
                        {line}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}

          {/* If everything is missing, show a friendly placeholder */}
          {!rev.axiom && !rev.purpose && !rev.seedEvent && !rev.body ? (
            <p className="dna-empty">No content fields present for this rev.</p>
          ) : null}
        </div>
      ) : (
        <OnboardingMeshDNAView
          rev={rev}
          taxonomy={taxonomy ?? rev.taxonomy ?? null}
          onSelectRev={onSelectRev}
          onHoverTargetId={onHoverTargetId}
        />
      )}
    </div>
  );
};

export default OnboardingMeshRevPanel;
