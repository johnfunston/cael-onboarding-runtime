import "./RevListItem.css";

type RevId = string;


export type DimensionKey =
  | "GENESIS"
  | "PROBLEM"
  | "PROPOSAL"
  | "MECHANISM"
  | "TEMPORAL_EVOLUTION"
  | "NAVIGATION_UI"
  | "ANALYTICS_ENGINE"
  | "CLASSIFICATION_LAYER"
  | "GRAPH_STRUCTURE"
  | "SEMANTIC_VECTOR"
  | "RUNTIME_ARCHITECTURE";

const DIMENSION_COLOR: Record<DimensionKey, string> = {
  GENESIS: "rgba(238, 246, 89, 0.95)",
  PROBLEM: "rgba(255, 140, 140, 0.9)",
  PROPOSAL: "rgba(180, 140, 255, 0.9)",
  MECHANISM: "rgba(120, 200, 255, 0.9)",
  TEMPORAL_EVOLUTION: "rgba(255, 180, 90, 0.9)",
  NAVIGATION_UI: "rgba(90, 255, 180, 0.9)",
  ANALYTICS_ENGINE: "rgba(255, 255, 255, 0.75)",
  CLASSIFICATION_LAYER: "rgba(255, 215, 90, 0.9)",
  GRAPH_STRUCTURE: "rgba(120, 200, 255, 0.75)",
  SEMANTIC_VECTOR: "rgba(180, 140, 255, 0.75)",
  RUNTIME_ARCHITECTURE: "rgba(90, 255, 180, 0.75)",
};

type OnboardingMeshRevListItemProps = {
  id: RevId;
  title: string;
  dimension: DimensionKey; // ✅ new
  selected: boolean;
  onSelect: (id: RevId) => void;
};

const OnboardingMeshRevListItem: React.FC<OnboardingMeshRevListItemProps> = ({
  id,
  title,
  selected,
  onSelect,
  dimension
}) => {
    const c = DIMENSION_COLOR[dimension];
 return (
    <div
      onClick={() => onSelect(id)}
      className={selected ? "selected-rev-list-item" : "rev-list-item"}
      style={{
        borderLeft: selected ? `16px solid ${c}` : `4px solid ${c}`,
      }}
    >
      {title}
      <div className="list-item-selection-bar-container">
        <div className="list-item-selection-bar" style={selected ? {backgroundColor: `${c}`} : {display: 'none'}}/>
      </div>
    </div>
  );
};

export default OnboardingMeshRevListItem;
