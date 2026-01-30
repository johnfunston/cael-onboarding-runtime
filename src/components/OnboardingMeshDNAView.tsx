// src/components/RevDNAView.tsx
import React, { useMemo } from "react";
import "./OnboardingMeshDNAView.css";

type RevId = string;

export type OnboardingRevLink = {
  targetId: RevId;
  type?: string;
  note?: string;
  confidence?: number;
  flavor?: string;
};

export type RevTaxonomy = {
  dimensions?: string[];
  families?: string[];
  subfamilies?: string[];
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

  // ✅ NEW canonical location (what you're passing from OnboardingMesh.tsx)
  taxonomy?: RevTaxonomy;

  metadata?: {
    lineageRank?: number;
    activation?: {
      current?: number;
      lastUpdated?: string;
      decayRate?: number;
    };

    // ⚠️ Legacy/deprecated location (keep optional for backward compatibility)
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
  taxonomy?: RevTaxonomy | null; // optional override prop (preferred)
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

function normalizeLinkType(type?: string): string {
  return (type ?? "related").toString().trim().toLowerCase();
}

const RevDNAView: React.FC<RevDNAViewProps> = ({
  rev,
  taxonomy,
  onSelectRev,
  onHoverTargetId,
}) => {
  const activation = rev.metadata?.activation;
  const lemma = rev.metadata?.lemma;
  const links = React.useMemo<OnboardingRevLink[]>(
  () => rev.links ?? [],
  [rev.links]
);
  // -------------------------
  // TAXONOMY (new canonical path + legacy fallback)
  // -------------------------
  const resolvedTaxonomy: RevTaxonomy | null = useMemo(() => {
    // preferred: explicit prop
    if (taxonomy) return taxonomy;

    // next: new canonical location on rev
    if (rev.taxonomy) return rev.taxonomy;

    // fallback: legacy metadata.taxonomy shape (strip weights)
    const legacy = rev.metadata?.taxonomy;
    if (!legacy) return null;

    return {
      dimensions: legacy.dimensions ?? [],
      families: legacy.families ?? [],
      subfamilies: legacy.subfamilies ?? [],
    };
  }, [taxonomy, rev.taxonomy, rev.metadata?.taxonomy]);

  const dimensions = resolvedTaxonomy?.dimensions ?? [];
  const families = resolvedTaxonomy?.families ?? [];
  const subfamilies = resolvedTaxonomy?.subfamilies ?? [];

  const hasTaxonomy =
    dimensions.length > 0 || families.length > 0 || subfamilies.length > 0;

  // -------------------------
  // LEMMA (metadata + link-derived)
  // -------------------------
  const lemmaRoles = lemma?.roles ?? [];
  const lemmaForMeta = lemma?.lemmaFor ?? [];
  const dependentOnMeta = lemma?.dependentOn ?? [];

  const prerequisiteForLinks = useMemo(
    () => links.filter((l) => normalizeLinkType(l.type) === "prerequisite_for"),
    [links]
  );

  const dependsOnLinks = useMemo(
    () => links.filter((l) => normalizeLinkType(l.type) === "depends_on"),
    [links]
  );

  const normalLinks = useMemo(
    () =>
      links.filter((l) => {
        const t = normalizeLinkType(l.type);
        return t !== "prerequisite_for" && t !== "depends_on";
      }),
    [links]
  );

  const hasLemmaMetadata =
    !!lemma &&
    (lemma.isLemma !== undefined ||
      lemma.confidence !== undefined ||
      lemmaRoles.length > 0 ||
      lemmaForMeta.length > 0 ||
      dependentOnMeta.length > 0);

  const hasLinkDerivedLemmaContent =
    prerequisiteForLinks.length > 0 || dependsOnLinks.length > 0;

  const showNoLemmaMetadata = !hasLemmaMetadata && !hasLinkDerivedLemmaContent;

  // -------------------------
  // shared render helper for link rows
  // -------------------------
const renderLinkList = (items: OnboardingRevLink[], keyPrefix: string) => (
  <ul className="dna-link-list">
    {items.map((link) => {
      const isLemmaLink =
        link.type === "prerequisite_for" || link.type === "depends_on";

      return (
        <li
          key={`${keyPrefix}:${link.targetId}`}
          className="dna-link-data"
        >
          <button
            type="button"
            className={`dna-link-target${isLemmaLink ? " lemma-link" : ""}`}
            onClick={() => onSelectRev?.(link.targetId)}
            onMouseEnter={() => onHoverTargetId?.(link.targetId)}
            onMouseLeave={() => onHoverTargetId?.(null)}
          >
            {link.targetId}
          </button>

          {link.flavor && (
            <>
              {" "}
              — <span className="dna-link-flavor">{link.flavor}</span>
            </>
          )}

          {link.note && <div className="dna-link-note">{link.note}</div>}
        </li>
      );
    })}
  </ul>
);


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
        {hasTaxonomy ? (
          <div className="dna-section-body">
            {dimensions.length > 0 ? (
              <div className="dna-subblock">
                <h3>Dimensions</h3>
                <ul className="dna-chip-list dimension-chip-list">
                  {dimensions.map((dim) => (
                    <li key={dim} className="dna-chip">
                      <span className="dna-chip-title">{dim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {families.length > 0 ? (
              <div className="dna-subblock">
                <h3>Families</h3>
                <ul className="dna-chip-list families-chip-list">
                  {families.map((fam) => (
                    <li key={fam} className="dna-chip">
                      <span className="dna-chip-title">{fam}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {subfamilies.length > 0 ? (
              <div className="dna-subblock">
                <h3>Subfamilies</h3>
                <ul className="dna-chip-list subfamilies-chip-list">
                  {subfamilies.map((sf) => (
                    <li key={sf} className="dna-chip">
                      <span className="dna-chip-title">{sf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="dna-empty">No taxonomy data.</p>
        )}
      </section>

      {/* LEMMA */}
      <section className="dna-section">
        <h2 className="dna-section-title">Lemma</h2>

        <div className="dna-section-body">
          {/* Lemma metadata block (only if any metadata exists) */}
          {hasLemmaMetadata ? (
            <>
              <p>
                <strong>Status:</strong> {lemma?.isLemma ? "Lemma" : "Not lemma"}
              </p>

              {lemma?.confidence !== undefined && (
                <p>
                  <strong>Confidence:</strong> {lemma.confidence}
                </p>
              )}

              {/* Roles */}
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

              {/* Lemma For (metadata) */}
              <div className="dna-subblock">
                <h3>Lemma For</h3>
                {lemmaForMeta.length > 0 ? (
                  <ul className="dna-list">
                    {lemmaForMeta.map((id) => (
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

              {/* Dependent On (metadata) */}
              <div className="dna-subblock">
                <h3>Dependent On</h3>
                {dependentOnMeta.length > 0 ? (
                  <ul className="dna-list">
                    {dependentOnMeta.map((id) => (
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
            </>
          ) : null}

          {/* Link-derived lemma blocks: render only if they have content */}
          {prerequisiteForLinks.length > 0 ? (
            <div className="dna-subblock">
              <h3>Lemma For</h3>
              {renderLinkList(prerequisiteForLinks, "prerequisite_for")}
            </div>
          ) : null}

          {dependsOnLinks.length > 0 ? (
            <div className="dna-subblock">
              <h3>Depends On</h3>
              {renderLinkList(dependsOnLinks, "depends_on")}
            </div>
          ) : null}

          {/* If NO metadata AND NO link-derived lemma content, show this */}
          {showNoLemmaMetadata ? (
            <p className="dna-empty">No lemma metadata.</p>
          ) : null}
        </div>
      </section>

      {/* LINKS */}
      <section className="dna-section">
        <h2 className="dna-section-title">Links</h2>
        {normalLinks.length > 0 ? (
          <div className="dna-section-body">
            {groupLinksByType(normalLinks).map(([type, linksOfType]) => (
              <div key={type} className="dna-subblock">
                <h3>{type}</h3>
                {renderLinkList(linksOfType, type)}
              </div>
            ))}
          </div>
        ) : (
          <p className="dna-empty">No semantic links.</p>
        )}
      </section>
    </div>
  );
};

export default RevDNAView;
