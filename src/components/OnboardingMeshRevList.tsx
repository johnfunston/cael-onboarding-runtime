// src/components/OnboardingMeshRevList.tsx
import React, { useEffect, useMemo, useRef } from "react";
import OnboardingMeshRevListItem from "./OnboardingMeshRevListItem";
import SearchBar from "./SearchBar";
import "./RevList.css";

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
};

const DIMENSION_COLOR: Record<DimensionKey, string> = {
  GENESIS: "rgba(238, 246, 89, 0.66)",
  PROBLEM: "rgba(255, 140, 140, 0.66)",
  PROPOSAL: "rgba(180, 140, 255, 0.66)",
  MECHANISM: "rgba(120, 200, 255, 0.66)",
  TEMPORAL_EVOLUTION: "rgba(255, 180, 90, 0.66)",
  NAVIGATION_UI: "rgba(90, 255, 180, 0.66)",
  ANALYTICS_ENGINE: "rgba(255, 255, 255, 0.66)",
  CLASSIFICATION_LAYER: "rgba(255, 215, 90, 0.66)",
  GRAPH_STRUCTURE: "rgba(120, 200, 255, 0.66)",
  SEMANTIC_VECTOR: "rgba(180, 140, 255, 0.66)",
  RUNTIME_ARCHITECTURE: "rgba(90, 255, 180, 0.66)",
};

const FILTER_CHIP_CONTAINER_STYLE: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 12,
  maxHeight: 250,
  width: 250,
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
}) => {
  const itemRefs = useRef<Map<RevId, HTMLDivElement>>(new Map());

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
    <div className="rev-list">
      {/* Search */}
      <SearchBar
        value={searchText}
        onChange={setSearchText}
        placeholder="Search revs..."
      />

      {/* Filter chips */}
      <div style={FILTER_CHIP_CONTAINER_STYLE}>
        {dimensionKeys.map((k) => {
          const on = enabledDimensions.has(k);
          const c = DIMENSION_COLOR[k];

          return (
            <button
              key={k}
              type="button"
              onClick={() => toggleDimension(k)}
              aria-pressed={on}
              style={{
                fontSize: 10,
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid ${c}`,
                background: on ? c : "rgba(255, 255, 255, 0.25)",
                opacity: on ? 1 : 0.33,
                color: "white",
                cursor: "pointer",
              }}
            >
              {formatDimensionLabel(k)}
            </button>
          );
        })}
      </div>

      {/* Grouped list */}
      <div className="rev-list-items" style={GROUP_LIST_STYLE}>
        {groups.map((group) => {
          const dimColor = DIMENSION_COLOR[group.dimension];

          return (
            <div key={group.dimension} style={{ marginBottom: 16 }}>
              <div
                style={{
                  ...GROUP_HEADER_BASE_STYLE,
                  color: 'white',
                }}
              >
                {formatGroupLabel(group.dimension)}
                <span style={{...GROUP_COUNT_STYLE, color: dimColor}}>({group.items.length})</span>
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
