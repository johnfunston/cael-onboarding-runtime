// src/components/OnboardingMeshRevList.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import OnboardingMeshRevListItem from "./OnboardingMeshRevListItem";
import SearchBar from "./SearchBar";
import "./RevList.css";

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

export type OnboardingRevListItemData = {
  id: RevId;
  title: string;
  dimension: DimensionKey;
  lineageRank: number;
};

export type RevGroup = {
  dimension: DimensionKey;
  items: OnboardingRevListItemData[];
};

export type SearchFieldKey =
  | "id"
  | "title"
  | "purpose"
  | "seedEvent"
  | "body"
  | "dimensions"
  | "families"
  | "subfamilies";

export type SearchFields = Record<SearchFieldKey, boolean>;

type OnboardingMeshRevListProps = {
  groups: RevGroup[];

  selectedId: RevId | null;
  onSelect: (id: RevId) => void;

  // filter chips
  dimensionKeys: DimensionKey[];
  enabledDimensions: Set<DimensionKey>;
  toggleDimension: (k: DimensionKey) => void;

  // search
  searchText: string;
  setSearchText: (s: string) => void;

  // field gating for search
  searchFields: SearchFields;
  setSearchFieldEnabled: (key: SearchFieldKey, enabled: boolean) => void;
};

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

const GROUP_LIST_STYLE: React.CSSProperties = { marginTop: 12 };

const GROUP_HEADER_BASE_STYLE: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.5,
  opacity: 0.8,
  margin: "10px 0 6px",
  textTransform: "uppercase",
};

const GROUP_COUNT_STYLE: React.CSSProperties = {
  position: "relative",
  color: "white",
  left: 15,
};

const formatDimensionLabel = (k: DimensionKey): string =>
  k.replaceAll("_", " ").toLowerCase();

const formatGroupLabel = (k: DimensionKey): string => k.replaceAll("_", " ");

const OnboardingMeshRevList: React.FC<OnboardingMeshRevListProps> = ({
  groups,
  selectedId,
  onSelect,
  dimensionKeys,
  enabledDimensions,
  toggleDimension,
  searchText,
  setSearchText,
  searchFields,
  setSearchFieldEnabled,
}) => {
  const itemRefs = useRef<Map<RevId, HTMLDivElement>>(new Map());

  // ✅ accordion state (default collapsed)
  const [dimsOpen, setDimsOpen] = useState<boolean>(false);

  // ✅ NEW: rev list open/closed (default open)
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const toggleIsOpen = (): void => setIsOpen((v) => !v);

  // Flat visible ids (for scroll-into-view)
  const visibleIds = useMemo<RevId[]>(() => {
    const ids: RevId[] = [];
    for (const g of groups) {
      for (const it of g.items) ids.push(it.id);
    }
    return ids;
  }, [groups]);

  useEffect(() => {
    if (!selectedId) return;
    if (!visibleIds.includes(selectedId)) return;

    const el = itemRefs.current.get(selectedId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedId, visibleIds]);

  return (
    <div
      className={`rev-list ${isOpen ? "is-open" : "is-closed"}`}
      data-open={isOpen ? "true" : "false"}
    >
      <button
        type="button"
        className="rev-list-toggle-button"
        onClick={toggleIsOpen}
        aria-pressed={!isOpen}
        aria-label={isOpen ? "Close rev list" : "Open rev list"}
        title={isOpen ? "Close" : "Open"}
      />

      {/* Search */}
      <SearchBar
        value={searchText}
        onChange={setSearchText}
        placeholder="Search revs..."
        searchFields={searchFields}
        setSearchFieldEnabled={setSearchFieldEnabled}
      />

      {/* ✅ Dimension filters accordion */}
      <div className="rev-list-dims-accordion">
        <button
          type="button"
          className={`${
            dimsOpen ? "rev-list-dims-header-is-open" : "rev-list-dims-header"
          }`}
          onClick={() => setDimsOpen((v) => !v)}
          aria-expanded={dimsOpen}
        >
          <span className="rev-list-dims-title">dimensions</span>
          <span className="rev-list-dims-meta">
            {dimsOpen ? "collapse" : "expand"}
          </span>
        </button>

        <div className={`rev-list-dims-body ${dimsOpen ? "open" : "closed"}`}>
          {dimensionKeys.map((k) => {
            const on = enabledDimensions.has(k);
            const c = DIMENSION_COLOR[k];

            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleDimension(k)}
                aria-pressed={on}
                className="rev-list-dim-chip"
                style={{
                  border: `1px solid ${c}`,
                  background: on ? c : "rgba(255, 255, 255, 0.25)",
                  opacity: on ? 1 : 0.33,
                }}
              >
                {formatDimensionLabel(k)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped list */}
      <div className="rev-list-items" style={GROUP_LIST_STYLE}>
        {groups.map((group) => {
          const dimColor = DIMENSION_COLOR[group.dimension];

          return (
            <div key={group.dimension} style={{ marginBottom: 16 }}>
              <div style={{ ...GROUP_HEADER_BASE_STYLE, color: "white" }}>
                {formatGroupLabel(group.dimension)}
                <span style={{ ...GROUP_COUNT_STYLE, color: dimColor }}>
                  ({group.items.length})
                </span>
              </div>

              {group.items.map((rev) => (
                <div
                  key={rev.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(rev.id, el);
                  }}
                >
                  <OnboardingMeshRevListItem
                    id={rev.id}
                    title={rev.title}
                    selected={rev.id === selectedId}
                    onSelect={onSelect}
                    dimension={rev.dimension}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingMeshRevList;
