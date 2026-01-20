import type { Rev } from "../lib/revTypes";
import { useState } from 'react';
import RevDNAView from './RevDNAView';
import ArchetypeIconBar from './ArchetypeIconBar'
import './RevDetailPanel.css'

interface RevDetailPanelProps {
  rev: Rev | null;
  isLoading?: boolean;
  onSelectRev?: (id: string) => void;
  hoveredId?: (id: string | null) => void;
}

const RevDetailPanel: React.FC<RevDetailPanelProps> = ({ rev, isLoading, onSelectRev, hoveredId }) => {
 const [viewMode, setViewMode] = useState<"content" | "dna">('content'); 
 if (!rev) {
    return (
      <div className="empty-panel">
        ?.rev
      </div>
    );
  }

  if(isLoading) {
    return (
        <div className="loading-panel">
            <p>Rev is loading...</p>
        </div>
    )
  }

  const handleClick = ()=> {
    if(viewMode === 'content') {
      setViewMode('dna')
    } else {
      setViewMode('content')
    }
    console.log(viewMode);
  }

  return (
    <div className="rev-detail">
      <div className='rev-panel-title-bar'>
        <h1 className='rev-panel-title'>{rev.title}</h1>
        <div onClick={handleClick} className={viewMode === 'dna' ? 'dna-button-selected' : 'dna-button'}>
          <img className='dna-icon' src="../../public/assets/dna-icon-white.png" alt="" />
          <p className="lineage-rank">{rev.metadata?.lineageRank}</p>
        </div>
      </div>
       <div className="archetypal-participation-banner">
          <ArchetypeIconBar activeArchetypes={rev.archetypes}/>
        </div>
      { viewMode === 'content' ? (
      <div className="rev-content-view">
        {rev.axiom && <blockquote className='rev-panel-axiom'><span className='axiom-quotations'>"</span>{rev.axiom}<span className='axiom-quotations'>"</span></blockquote>}
        <p className='rev-panel-body'><span className='content-field-title'>Purpose<br/></span>{rev.purpose}</p>
        <p className='rev-panel-body'><span className='content-field-title'>Seed Event<br/></span>{rev.seedEvent}</p>
        <p className='rev-panel-body'><span className='content-field-title'>Body<br/></span>{rev.body}</p>
      </div>
      ) : (
        <RevDNAView rev={rev} onSelectRev={onSelectRev} onHoverLink={hoveredId}/>
      )
      }
    </div>
  );
};

export default RevDetailPanel;
