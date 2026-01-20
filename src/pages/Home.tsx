// Home.tsx
import { useState } from "react";
import MeshLayout from "../layouts/MeshLayout";
import RevList from "../components/RevList";
import RevDetailPanel from "../components/RevDetailPanel";
import { useMesh } from "../hooks/useMesh";
import { useRev } from "../hooks/useRev";
import ViewsToggleButton from "../components/ViewsToggleButton";
import type { DimensionalView } from "../components/ViewsToggleButton";
//import SearchBar from "../components/SearchBar";
import LogoButton from "../components/LogoButton";
import MeshTopologyView from "../components/MeshTopologyView"; // 2D
import MeshTopologyView3D from "../components/MeshTopologyView3D"; // 3D
import "../styles/global.css";

const Home = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dimensionalView, setDimensionalView] =
    useState<DimensionalView>("2d");

  const { data: mesh } = useMesh();
  const { data: selectedRev, isLoading: revLoading } = useRev(selectedId);

  console.log(hoveredId)

  const left = (
    <>
      <LogoButton />
      <RevList
        revs={mesh || []}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </>
  );

  const center = (
    <div>
      {dimensionalView === "2d" ? (
        <MeshTopologyView
          onSelectRev={setSelectedId}
          selectedId={selectedId}
          hoveredId={hoveredId}
        />
      ) : (
        <MeshTopologyView3D
          onSelectRev={setSelectedId}
          selectedId={selectedId}
        />
      )}
      <ViewsToggleButton
        currentView={dimensionalView}
        onChangeView={setDimensionalView}
        onClearSelection={() => setSelectedId(null)}
      />
    </div>
  );

  const right = (
    <RevDetailPanel
      rev={selectedRev ?? null}
      isLoading={revLoading}
      onSelectRev={(id) => setSelectedId(id)}
      hoveredId={(id) => setHoveredId(id)}
    />
  );

  return (
    <div className="home">
      <MeshLayout left={left} center={center} right={right} />
    </div>
  );
};

export default Home;
