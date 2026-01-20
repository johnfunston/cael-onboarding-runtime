import React from 'react'
import './ArchetypeIconBar.css'

interface ArchetypeIconBarProps {
  activeArchetypes?: ( string[] | null);
}

const ArchetypeIconBar: React.FC<ArchetypeIconBarProps> = ({ activeArchetypes }) => {
    
const list = activeArchetypes ?? [];

if (list.length === 0) return null;


  return (
    <div className='archetype-icon-bar'>
        <ul className="archetype-list">
        {list.map((archetype) => (
            <li key={archetype} className='archetype-icon'>
                <img src={`/assets/${archetype.toLowerCase()}-icon-white.png`} alt={archetype} />
            </li>
        ))}
        </ul>
    </div>
  )
}


export default ArchetypeIconBar