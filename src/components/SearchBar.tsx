// src/components/SearchBar.tsx
import "./SearchBar.css";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => {
  return (
    <div className="search-bar">
      <div className="search-bar-icon">
        <img src="/assets/eye-icon-white.png" alt="" />
      </div>

      <div className="search-bar-input-field">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Search..."}
        />
      </div>

      <div className="search-bar-button" />
    </div>
  );
};

export default SearchBar;
