// src/components/OnboardingMeshRevList.tsx
import { useEffect, useMemo, useRef } from "react";
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
    
  // Build a flat visible list for scroll-into-view
  const visibleIds = useMemo(() => {
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
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedId, visibleIds]);

  return (
    <div className="rev-list">
      {/* Search */}
      <SearchBar value={searchText} onChange={setSearchText} placeholder="Search revs..." />

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, maxHeight: 250, width: '25vw' }}>
        {dimensionKeys.map((k) => {
          const on = enabledDimensions.has(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggleDimension(k)}
              style={{
                fontSize: 10,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.25)",
                background: on ? "rgba(150, 253, 24, 0.18)" : "rgba(137, 62, 62, 0.25)",
                color: "white",
                cursor: "pointer",
              }}
              aria-pressed={on}
            >
              {k.replaceAll("_", " ").toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Grouped list */}
      <div className="rev-list-items" style={{ marginTop: 12 }}>
        {groups.map((group) => (
          <div key={group.dimension} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 1.5,
                opacity: 0.8,
                margin: "10px 0 6px",
                textTransform: "uppercase",
                color: "white",
              }}
            >
              {group.dimension.replaceAll("_", " ")}
              <span style={{position: 'relative', color: "rgba(100, 233, 149)", left: '15px'}}>({group.items.length})</span>
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
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingMeshRevList;
