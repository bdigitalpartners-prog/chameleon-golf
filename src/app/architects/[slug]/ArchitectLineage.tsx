"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GitBranch, ChevronRight } from "lucide-react";

interface RelationshipItem {
  relationshipId: number;
  type: string;
  description: string | null;
  architect: {
    id: number;
    name: string;
    slug: string;
    era: string | null;
    bornYear: number | null;
    diedYear: number | null;
    portraitUrl: string | null;
    imageUrl: string | null;
  };
}

interface DesignDNA {
  naturalism: number;
  strategicDepth: number;
  visualDrama: number;
  greenComplexity: number;
  bunkerArtistry: number;
  routingGenius: number;
  minimalism: number;
  playability: number;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};

const ERA_COLORS: Record<string, string> = {
  Pioneer: "#8B4513",
  "Golden Age": "#FFD700",
  "Post-War": "#4169E1",
  Modern: "#00FF85",
  Contemporary: "#9333EA",
};

function getEraColor(era: string | null): string {
  if (!era) return "#666";
  for (const [key, color] of Object.entries(ERA_COLORS)) {
    if (era.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#666";
}

/* ─── SVG Radar Chart ─── */
function ArchitectDNARadar({ dna }: { dna: DesignDNA }) {
  const dimensions = [
    { key: "naturalism", label: "Naturalism" },
    { key: "strategicDepth", label: "Strategy" },
    { key: "visualDrama", label: "Drama" },
    { key: "greenComplexity", label: "Greens" },
    { key: "bunkerArtistry", label: "Bunkers" },
    { key: "routingGenius", label: "Routing" },
    { key: "minimalism", label: "Minimal" },
    { key: "playability", label: "Playability" },
  ];

  const cx = 140;
  const cy = 140;
  const maxR = 100;
  const n = dimensions.length;

  function polarToXY(angle: number, r: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const rings = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = dimensions.map((dim, i) => {
    const val = (dna[dim.key as keyof DesignDNA] || 0) / 100;
    return polarToXY((360 / n) * i, maxR * val);
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={280} height={280} viewBox="0 0 280 280">
        {rings.map((r) => (
          <polygon key={r}
            points={dimensions.map((_, i) => {
              const p = polarToXY((360 / n) * i, maxR * r);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
        ))}
        {dimensions.map((_, i) => {
          const p = polarToXY((360 / n) * i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />;
        })}
        <polygon
          points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="rgba(0,255,133,0.12)" stroke="#00FF85" strokeWidth={2} />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#00FF85" />
        ))}
        {dimensions.map((dim, i) => {
          const p = polarToXY((360 / n) * i, maxR + 22);
          return (
            <text key={dim.key} x={p.x} y={p.y}
              textAnchor="middle" dominantBaseline="middle"
              fill="#9CA3AF" fontSize={9} fontWeight={500}>
              {dim.label}
            </text>
          );
        })}
      </svg>

      <div className="grid grid-cols-4 gap-3 mt-3 w-full">
        {dimensions.map((dim) => (
          <div key={dim.key} className="text-center">
            <div className="text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
              {dna[dim.key as keyof DesignDNA]}
            </div>
            <div className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>{dim.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Relationship Card ─── */
function RelationCard({ item, relationLabel }: { item: RelationshipItem; relationLabel: string }) {
  const img = item.architect.portraitUrl || item.architect.imageUrl;
  const eraColor = getEraColor(item.architect.era);

  return (
    <Link href={`/architects/${item.architect.slug}`}
      className="flex items-center gap-3 rounded-lg p-3 transition-all hover:ring-1 hover:ring-emerald-500"
      style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0"
        style={{ border: `2px solid ${eraColor}`, backgroundColor: "var(--cg-bg-primary)", color: "var(--cg-text-primary)" }}>
        {img ? <img src={img} alt={item.architect.name} className="w-full h-full object-cover" /> :
          item.architect.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
          {item.architect.name}
        </div>
        <div className="text-xs" style={{ color: eraColor }}>
          {item.architect.era || "Unknown"} · {relationLabel}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--cg-text-muted)" }} />
    </Link>
  );
}

/* ─── Main Component ─── */
export function ArchitectLineage({ architectId }: { architectId: number }) {
  const [genealogy, setGenealogy] = useState<{
    mentors: RelationshipItem[];
    mentees: RelationshipItem[];
    influencedBy: RelationshipItem[];
    influenced: RelationshipItem[];
    partners: RelationshipItem[];
  } | null>(null);
  const [dna, setDna] = useState<DesignDNA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/architects/${architectId}/genealogy`)
        .then((r) => r.json())
        .then((data) => {
          if (data.mentors) setGenealogy(data);
        })
        .catch(() => {}),
      fetch(`/api/architects/${architectId}/design-dna`)
        .then((r) => r.json())
        .then((data) => {
          if (data.dimensions) setDna(data.dimensions);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [architectId]);

  if (loading) return null;

  const hasGenealogy = genealogy && (
    genealogy.mentors.length > 0 ||
    genealogy.mentees.length > 0 ||
    genealogy.influencedBy.length > 0 ||
    genealogy.influenced.length > 0 ||
    genealogy.partners.length > 0
  );

  if (!hasGenealogy && !dna) return null;

  return (
    <div className="space-y-6 mb-6">
      {/* Design DNA Radar */}
      {dna && (
        <section style={cardStyle}>
          <h2 className="mb-3 text-lg font-semibold flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
            <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm"
              style={{ backgroundColor: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)" }}>
              🧬
            </span>
            Design DNA
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--cg-text-muted)" }}>
            Eight-dimensional design philosophy profile
          </p>
          <ArchitectDNARadar dna={dna} />
        </section>
      )}

      {/* Design Lineage */}
      {hasGenealogy && (
        <section style={cardStyle}>
          <h2 className="mb-3 text-lg font-semibold flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
            <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm"
              style={{ backgroundColor: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)" }}>
              <GitBranch className="w-4 h-4" style={{ color: "#00FF85" }} />
            </span>
            Design Lineage
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--cg-text-muted)" }}>
            Mentor-student connections and design influences
          </p>

          <div className="space-y-5">
            {genealogy!.mentors.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--cg-text-muted)" }}>
                  Learned From
                </h4>
                <div className="space-y-2">
                  {genealogy!.mentors.map((item) => (
                    <RelationCard key={item.relationshipId} item={item} relationLabel="Mentor" />
                  ))}
                </div>
              </div>
            )}

            {genealogy!.mentees.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--cg-text-muted)" }}>
                  Mentored / Taught
                </h4>
                <div className="space-y-2">
                  {genealogy!.mentees.map((item) => (
                    <RelationCard key={item.relationshipId} item={item} relationLabel="Mentee" />
                  ))}
                </div>
              </div>
            )}

            {genealogy!.influencedBy.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--cg-text-muted)" }}>
                  Influenced By
                </h4>
                <div className="space-y-2">
                  {genealogy!.influencedBy.map((item) => (
                    <RelationCard key={item.relationshipId} item={item} relationLabel="Influence" />
                  ))}
                </div>
              </div>
            )}

            {genealogy!.influenced.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--cg-text-muted)" }}>
                  Influenced
                </h4>
                <div className="space-y-2">
                  {genealogy!.influenced.map((item) => (
                    <RelationCard key={item.relationshipId} item={item} relationLabel="Influenced" />
                  ))}
                </div>
              </div>
            )}

            {genealogy!.partners.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--cg-text-muted)" }}>
                  Partners / Collaborators
                </h4>
                <div className="space-y-2">
                  {genealogy!.partners.map((item) => (
                    <RelationCard key={item.relationshipId} item={item} relationLabel="Partner" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/architects/genealogy"
            className="mt-4 block text-center text-xs py-2 rounded-lg transition-all hover:bg-white/5"
            style={{ color: "var(--cg-accent)", border: "1px solid var(--cg-border)" }}>
            View Full Genealogy Tree →
          </Link>
        </section>
      )}
    </div>
  );
}
