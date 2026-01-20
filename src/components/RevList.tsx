import { useEffect, useRef } from 'react';
import RevListItem from './RevListItem.tsx';
import type { RevSummary } from "../lib/revTypes";
import './RevList.css';

type RevListProps = {
    revs: RevSummary[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

const RevList = ({ revs, selectedId, onSelect }: RevListProps) => {

    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
        if (!selectedId) return;

        const el = itemRefs.current.get(selectedId);
        if (el){
            el.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [selectedId])

  return (
    <div className="rev-list">
        <div className="rev-list-items">
            {revs.map((rev) => (
            <div
                key={rev.id}
                ref={(el) => {
                if (el) itemRefs.current.set(rev.id, el);
                }}
            >
                <RevListItem
                id={rev.id}
                title={rev.title}
                selected={rev.id === selectedId}
                onSelect={onSelect}
                />
            </div>
            ))}
            </div>
        </div>
  )
}

export default RevList