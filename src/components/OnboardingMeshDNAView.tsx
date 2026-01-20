// src/components/RevDNAView.tsx
import React from "react";
import "./RevDNAView.css";

type RevId = string;

export type OnboardingRevLink = {
  targetId: RevId;
  type?: string;
  note?: string;
  confidence?: number;
  flavor?: string;
};

export type OnboardingRev = {
  id: RevId;
  title?: string;
  purpose?: string;
  seedEvent?: string;
  body?: string;
  axiom?: string;
  archetypes?: string[];
  tags?: string[];
  links?: OnboardingRevLink[];
  metadata?: {
    lineageRank?: number;
    // onboarding JSON may not include these yet; keep them optional
    activation?: {
      current?: number;
      lastUpdated?: string;
      decayRate?: number;
    };
    taxonomy?: {
      dimensions?: string[];
      dimensionWeights?: Record<string, number>;
      subfamilies?: string[];
      subfamilyWeights?: Record<string, number>;
      families?: string[];
    };
    lemma?: {
      isLemma?: boolean;
      confidence?: number;
      roles?: string[];
      lemmaFor?: RevId[];
      dependentOn?: RevId[];
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

interface RevDNAViewProps {
  rev: OnboardingRev;
  onSelectRev?: (id: RevId) => void;
  onHoverTargetId?: (id: RevId | null) => void;
}

function groupLinksByType(
  links: OnboardingRevLink[]
): Array<[string, OnboardingRevLink[]]> {
  const map = new Map<string, OnboardingRevLink[]>();
  for (const link of links) {
    const t = (link.type ?? "related").toString();
    const arr = map.get(t) ?? [];
    arr.push(link);
    map.set(t, arr);
  }
  return Array.from(map.entries());
}

const RevDNAView: React.FC<RevDNAViewProps> = ({
  rev,
  onSelectRev,
  onHoverTargetId,
}) => {
  const activation = rev.metadata?.activation;
  const taxonomy = rev.metadata?.taxonomy;
  const lemma = rev.metadata?.lemma;
  const links = rev.links ?? [];

  const lemmaRoles = lemma?.roles ?? [];
  const lemmaFor = lemma?.lemmaFor ?? [];
  const dependentOn = lemma?.dependentOn ?? [];

  return (
    <div className="rev-dna-view">
      {/* ACTIVATION */}
      <section className="dna-section">
        <h2 className="dna-section-title">Activation</h2>
        {activation ? (
          <div className="dna-section-body">
            {activation.current !== undefined && (
              <p>
                <strong>Current:</strong> {activation.current}
              </p>
            )}
            {activation.lastUpdated && (
              <p>
                <strong>Last Updated:</strong> {activation.lastUpdated}
              </p>
            )}
            {activation.decayRate !== undefined && (
              <p>
                <strong>Decay Rate:</strong> {activation.decayRate}
              </p>
            )}
            {activation.current === undefined &&
              !activation.lastUpdated &&
              activation.decayRate === undefined && (
                <p className="dna-empty">No activation fields present.</p>
              )}
          </div>
        ) : (
          <p className="dna-empty">No activation data.</p>
        )}
      </section>

      {/* TAXONOMY */}
      <section className="dna-section">
        <h2 className="dna-section-title">Taxonomy</h2>
        {taxonomy ? (
          <div className="dna-section-body">
            {/* Dimensions */}
            <div className="dna-subblock">
              <h3>Dimensions</h3>
              {taxonomy.dimensions && taxonomy.dimensions.length > 0 ? (
                <ul className="dna-chip-list">
                  {taxonomy.dimensions.map((dim) => (
                    <li key={dim} className="dna-chip">
                      <span className="dna-chip-title">{dim}</span>
                      {taxonomy.dimensionWeights &&
                        taxonomy.dimensionWeights[dim] !== undefined && (
                          <span className="dna-weight">
                            w {taxonomy.dimensionWeights[dim].toFixed(2)}
                          </span>
                        )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dna-empty">No dimensions.</p>
              )}
            </div>

            {/* Subfamilies */}
            <div className="dna-subblock">
              <h3>Subfamilies</h3>
              {taxonomy.subfamilies && taxonomy.subfamilies.length > 0 ? (
                <ul className="dna-chip-list">
                  {taxonomy.subfamilies.map((sf) => (
                    <li key={sf} className="dna-chip">
                      <span className="dna-chip-title">{sf}</span>
                      {taxonomy.subfamilyWeights &&
                        taxonomy.subfamilyWeights[sf] !== undefined && (
                          <span className="dna-weight">
                            w {taxonomy.subfamilyWeights[sf].toFixed(2)}
                          </span>
                        )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dna-empty">No subfamilies.</p>
              )}
            </div>

            {/* Families */}
            <div className="dna-subblock">
              <h3>Families</h3>
              {taxonomy.families && taxonomy.families.length > 0 ? (
                <ul className="dna-chip-list">
                  {taxonomy.families.map((fam) => (
                    <li key={fam} className="dna-chip">
                      <span className="dna-chip-title">{fam}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dna-empty">No families.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="dna-empty">No taxonomy data.</p>
        )}
      </section>

      {/* LEMMA */}
      <section className="dna-section">
        <h2 className="dna-section-title">Lemma</h2>
        {lemma ? (
          <div className="dna-section-body">
            <p>
              <strong>Status:</strong> {lemma.isLemma ? "Lemma" : "Not lemma"}
            </p>

            {lemma.confidence !== undefined && (
              <p>
                <strong>Confidence:</strong> {lemma.confidence}
              </p>
            )}

            <div className="dna-subblock">
              <h3>Roles</h3>
              {lemmaRoles.length > 0 ? (
                <ul className="dna-chip-list">
                  {lemmaRoles.map((role) => (
                    <li key={role} className="dna-chip">
                      <span className="dna-chip-title">{role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dna-empty">No roles.</p>
              )}
            </div>

            <div className="dna-subblock">
              <h3>Lemma For</h3>
              {lemmaFor.length > 0 ? (
                <ul className="dna-list">
                  {lemmaFor.map((id) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onSelectRev?.(id)}
                        className="dna-lemma-title dna-lemma-link"
                        onMouseEnter={() => onHoverTargetId?.(id)}
                        onMouseLeave={() => onHoverTargetId?.(null)}
                      >
                        {id}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dna-empty">No lemma targets.</p>
              )}
            </div>

            <div className="dna-subblock">
              <h3>Dependent On</h3>
              {dependentOn.length > 0 ? (
                <ul className="dna-list">
                  {dependentOn.map((id) => (
                    <li key={id}>
                      <button
                        type="button"
                        className="dna-lemma-title dna-lemma-link"
                        onClick={() => onSelectRev?.(id)}
                        onMouseEnter={() => onHoverTargetId?.(id)}
                        onMouseLeave={() => onHoverTargetId?.(null)}
                      >
                        {id}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dna-empty">No dependencies.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="dna-empty">No lemma metadata.</p>
        )}
      </section>

      {/* LINKS */}
      <section className="dna-section">
        <h2 className="dna-section-title">Links</h2>
        {links.length > 0 ? (
          <div className="dna-section-body">
            {groupLinksByType(links).map(([type, linksOfType]) => (
              <div key={type} className="dna-subblock">
                <h3>{type}</h3>
                <ul className="dna-link-list">
                  {linksOfType.map((link) => (
                    <li key={`${type}:${link.targetId}`} className="dna-link-data">
                      <button
                        type="button"
                        className="dna-link-target"
                        onClick={() => onSelectRev?.(link.targetId)}
                        onMouseEnter={() => onHoverTargetId?.(link.targetId)}
                        onMouseLeave={() => onHoverTargetId?.(null)}
                      >
                        {link.targetId}
                      </button>

                      {link.flavor && (
                        <>
                          {" "}
                          —{" "}
                          <span className="dna-link-flavor">{link.flavor}</span>
                        </>
                      )}

                      {link.note && <div className="dna-link-note">{link.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="dna-empty">No links.</p>
        )}
      </section>
    </div>
  );
};

export default RevDNAView;
