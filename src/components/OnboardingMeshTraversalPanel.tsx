// src/components/OnboardingMeshTraversalPanel.tsx
import React from "react";
import "./OnboardingMeshTraversalPanel.css";

type RevId = string;
type LineageRank = number;

type OnboardingMeshTraversalPanelProps = {
  loadedCount: number;

  dataValidationError: string | null;
  mappingWarning: string | null;

  activeNodeId: RevId;
  hoveredNodeId: RevId | null;

  sequentialTraversalStep: number;
  activeLineageRank: LineageRank | null;

  activeTitle: string | null;

  // NEW: three-button gating + actions
  canPrev: boolean;
  canNextSequential: boolean;
  canNextByRank: boolean;

  onPrev: () => void;
  onNextSequential: () => void;
  onNextByRank: () => void;

  // Placeholder for later “location copy”
  locationLabel?: string | null;
  locationHint?: string | null;

  note?: string;
};

const OnboardingMeshTraversalPanel: React.FC<OnboardingMeshTraversalPanelProps> = ({
  dataValidationError,
  mappingWarning,
  sequentialTraversalStep,
  activeTitle,
  canPrev,
  canNextSequential,
  canNextByRank,
  onPrev,
  onNextSequential,
  onNextByRank,
  locationLabel,
  locationHint,
}) => {
  return (
    <div className="traversal-panel-container">
      <div className="traversal-panel-inner">

        {/* Status (keep for now; you can slim this later) */}
        <div style={{ display: "grid", gap: 6 }}>
          {dataValidationError && (
            <div style={{ whiteSpace: "pre-wrap" }}>
              <strong style={{ color: "crimson" }}>Data error:</strong>{" "}
              {dataValidationError}
            </div>
          )}

          {mappingWarning && (
            <div style={{ whiteSpace: "pre-wrap" }}>
              <strong style={{ color: "crimson" }}>Mapping warning:</strong>{" "}
              {mappingWarning}
            </div>
          )}
        {/* Controls row: Prev left, two Next buttons right, location in middle */}
        <div className="traversal-controls-row">
          <div className="traversal-controls-left">
            <button type="button" className= {!canPrev ? 'disabled-rank-button' : 'rank-button'} onClick={onPrev} disabled={!canPrev}>
              Prev
            </button>
          </div>
          <div className="rev-title">{activeTitle}</div>
          <div className="traversal-controls-middle">
            {/* Placeholder text (you’ll fill this in later) */}
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              <strong>{locationLabel ?? ""}</strong>
            </div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              {locationHint ?? ""}
            </div>
          </div>

          <div className="traversal-controls-right">
            <button
              type="button"
              className='sequential-button'
              onClick={onNextSequential}
              disabled={!canNextSequential}
              title="Guided next (sequential traversal)"
            >
              Next ({sequentialTraversalStep})
            </button>

            <button
              type="button"
              className='rank-button'
              onClick={onNextByRank}
              disabled={!canNextByRank}
              title="Next by lineageRank (active rank + 1)"
            >
              Next (Rank)
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default OnboardingMeshTraversalPanel;
