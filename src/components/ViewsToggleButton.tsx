// ViewsToggleButton.tsx
import React from "react";
import "./ViewsToggleButton.css";

export type DimensionalView = "2d" | "3d";

interface ViewsToggleButtonProps {
  currentView: DimensionalView;
  onChangeView?: (view: DimensionalView) => void;
  onClearSelection?: () => void;
}

const ViewsToggleButton: React.FC<ViewsToggleButtonProps> = ({
  currentView,
  onChangeView,
  onClearSelection,
}) => {
  const handleMeshClick = () => {
    if (onClearSelection) {
      onClearSelection();
    }
  };

  const handle2DClick = () => {
    if (onClearSelection) {
      onClearSelection();
    }
    onChangeView?.("2d");
  };

  const handle3DClick = () => {
    onChangeView?.("3d");
  };

  return (
    <div className="views-toggle-button-container">
      <div
        onClick={handleMeshClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleMeshClick();
          }
        }}
        className="views-toggle-button"
      >
        <div className="hexagon-toggle hex-1"></div>
        <div className="hexagon-toggle hex-2"></div>
        <div className="hexagon-toggle hex-3"></div>
        <div className="hexagon-toggle hex-4"></div>
        <div className="hexagon-toggle hex-5"></div>
      </div>
      <div>
        <p className="view-label">MESH</p>
        <div className="view-button-container">
        <button
          type="button"
          onClick={handle2DClick}
          className={currentView === "2d" ? "view-toggle-active" : "view-button"}
        >
          2D
        </button>
        <button
          type="button"
          onClick={handle3DClick}
          className={currentView === "3d" ? "view-toggle-active" : "view-button"}
        >
          3D
        </button>
        </div>
      </div>
    </div>
  );
};

export default ViewsToggleButton;
