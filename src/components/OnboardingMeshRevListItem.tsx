import "./RevListItem.css";

type RevId = string;

type OnboardingMeshRevListItemProps = {
  id: RevId;
  title: string;
  selected: boolean;
  onSelect: (id: RevId) => void;
};

const OnboardingMeshRevListItem: React.FC<OnboardingMeshRevListItemProps> = ({
  id,
  title,
  selected,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(id)}
      className={selected ? "selected-rev-list-item" : "rev-list-item"}
    >
      {title}
      <div className="list-item-selection-bar-container">
        <div className="list-item-selection-bar" />
      </div>
    </div>
  );
};

export default OnboardingMeshRevListItem;
