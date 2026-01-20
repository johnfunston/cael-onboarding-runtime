import './RevListItem.css'

type RevListItemProps = {
    id: string;
    title: string;
    selected: boolean;
    onSelect: (id: string) => void;
};
const RevListItem = ({ id, title, selected, onSelect}: RevListItemProps) => {
  return (
    <div
        onClick={() => onSelect(id)}
        className={ selected ? 'selected-rev-list-item' : 'rev-list-item'}
    >
        {title}
        <div className="list-item-selection-bar-container">
          <div className="list-item-selection-bar">
            
          </div>
        </div>
    </div>
  );
}

export default RevListItem