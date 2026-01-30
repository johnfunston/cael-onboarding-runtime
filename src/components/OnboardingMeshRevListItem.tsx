import "./RevListItem.css";

type RevId = string;


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
