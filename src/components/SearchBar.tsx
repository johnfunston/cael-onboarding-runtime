// src/components/SearchBar.tsx
import React, { useMemo, useRef, useState } from "react";
import "./SearchBar.css";

type SearchFieldKey =
  | "id"
  | "title"
  | "purpose"
  | "seedEvent"
  | "body"
  | "dimensions"
  | "families"
  | "subfamilies";

type SearchFields = Record<SearchFieldKey, boolean>;

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;

  searchFields: SearchFields;
  setSearchFieldEnabled: (key: SearchFieldKey, enabled: boolean) => void;
};

const FIELD_LABELS: Record<SearchFieldKey, string> = {
  id: "id",
  title: "title",
  purpose: "purpose",
  seedEvent: "seedEvent",
  body: "body",
  dimensions: "dimensions",
  families: "families",
  subfamilies: "subfamilies",
};

const FIELD_ORDER: SearchFieldKey[] = [
  "id",
  "title",
  "purpose",
  "seedEvent",
  "body",
  "dimensions",
  "families",
  "subfamilies",
];

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  searchFields,
  setSearchFieldEnabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const iconBtnRef = useRef<HTMLButtonElement | null>(null);

  const enabledCount = useMemo(() => {
    return Object.values(searchFields).filter(Boolean).length;
  }, [searchFields]);

  return (
    <div className="search-bar">
      {/* ✅ icon is the trigger */}
      <div className={`search-bar-icon ${isOpen ? "is-open" : ""}`}>
        <button
          ref={iconBtnRef}
          type="button"
          className="search-bar-icon-button"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          title={`Search fields (${enabledCount})`}
        >
          <img src="/assets/eye-icon-white.png" alt="" />
        </button>
      </div>

      <div className="search-bar-input-field">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Search..."}
        />
      </div>

      {/* popover */}
      {isOpen ? (
        <div ref={panelRef} className="search-filter-panel" role="dialog">
          <div className="search-filter-panel-header">
            <button
              type="button"
              className="search-filter-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="search-filter-options">
            {FIELD_ORDER.map((key) => {
              const checked = !!searchFields[key];
              return (
                <label key={key} className="search-filter-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setSearchFieldEnabled(key, e.target.checked)
                    }
                  />
                  <span className="search-filter-label">
                    {FIELD_LABELS[key]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SearchBar;
