"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { GitBranch, Search, ZoomIn, ZoomOut, Maximize2, X, ChevronRight } from "lucide-react";

/* ─── Types ─── */
interface TreeNode {
  id: number;
  name: string;
  slug: string;
  era: string | null;
  bornYear: number | null;
  diedYear: number | null;
  portraitUrl: string | null;
  imageUrl: string | null;
}

interface TreeEdge {
  id: number;
  from: number;
  to: number;
  type: string;
  description: string | null;
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

interface GenealogyData {
  architect: any;
  mentors: any[];
  mentees: any[];
  influencedBy: any[];
  influenced: any[];
  partners: any[];
}

/* ─── Era Colors ─── */
const ERA_COLORS: Record<string, string> = {
  Pioneer: "#8B4513",
  "Golden Age": "#FFD700",
  "Post-War": "#4169E1",
  Modern: "#00FF85",
  Contemporary: "#9333EA",
};

function getEraColor(era: string | null): string {
  if (!era) return "#666666";
  for (const [key, color] of Object.entries(ERA_COLORS)) {
    if (era.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#666666";
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

/* ─── Architect Node Component ─── */
function ArchitectNode({
  node,
  selected,
  onClick,
  style,
}: {
  node: TreeNode;
  selected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  const eraColor = getEraColor(node.era);
  const img = node.portraitUrl || node.imageUrl;

  return (
    <div
      className="flex flex-col items-center cursor-pointer transition-all duration-200 hover:scale-110"
      onClick={onClick}
      style={style}
    >
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
        style={{
          border: `3px solid ${selected ? "#00FF85" : eraColor}`,
          backgroundColor: "#111111",
          boxShadow: selected ? `0 0 20px ${eraColor}40` : "0 2px 8px rgba(0,0,0,0.4)",
          color: "white",
        }}
      >
        {img ? (
          <img src={img} alt={node.name} className="w-full h-full object-cover" />
        ) : (
          getInitials(node.name)
        )}
      </div>
      <div className="mt-1.5 text-center max-w-[100px]">
        <div className="text-[11px] font-medium truncate" style={{ color: "white" }}>
          {node.name}
        </div>
        <div className="text-[9px]" style={{ color: eraColor }}>
          {node.era || "Unknown era"}
        </div>
        {node.bornYear && (
          <div className="text-[9px]" style={{ color: "#666" }}>
            {node.bornYear}{node.diedYear ? `–${node.diedYear}` : "–present"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Design DNA Radar (SVG-based) ─── */
function DesignDNARadar({ dna }: { dna: DesignDNA }) {
  const dimensions = [
    { key: "naturalism", label: "Naturalism" },
    { key: "strategicDepth", label: "Strategic Depth" },
    { key: "visualDrama", label: "Visual Drama" },
    { key: "greenComplexity", label: "Green Complexity" },
    { key: "bunkerArtistry", label: "Bunker Artistry" },
    { key: "routingGenius", label: "Routing Genius" },
    { key: "minimalism", label: "Minimalism" },
    { key: "playability", label: "Playability" },
  ];

  const cx = 120;
  const cy = 120;
  const maxR = 90;
  const n = dimensions.length;

  function polarToXY(angle: number, r: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Data points
  const dataPoints = dimensions.map((dim, i) => {
    const val = (dna[dim.key as keyof DesignDNA] || 0) / 100;
    const angle = (360 / n) * i;
    return polarToXY(angle, maxR * val);
  });
  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="flex flex-col items-center">
      <svg width={240} height={240} viewBox="0 0 240 240">
        {/* Grid rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={dimensions.map((_, i) => {
              const p = polarToXY((360 / n) * i, maxR * r);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.5}
          />
        ))}
        {/* Axes */}
        {dimensions.map((_, i) => {
          const p = polarToXY((360 / n) * i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />;
        })}
        {/* Data polygon */}
        <polygon points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="rgba(0,255,133,0.15)" stroke="#00FF85" strokeWidth={2} />
        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#00FF85" />
        ))}
        {/* Labels */}
        {dimensions.map((dim, i) => {
          const p = polarToXY((360 / n) * i, maxR + 18);
          return (
            <text key={dim.key} x={p.x} y={p.y}
              textAnchor="middle" dominantBaseline="middle"
              fill="#9CA3AF" fontSize={8} fontWeight={500}>
              {dim.label}
            </text>
          );
        })}
      </svg>
      <div className="grid grid-cols-4 gap-2 mt-2 w-full">
        {dimensions.map((dim) => (
          <div key={dim.key} className="text-center">
            <div className="text-xs font-bold" style={{ color: "#00FF85" }}>
              {dna[dim.key as keyof DesignDNA]}
            </div>
            <div className="text-[9px]" style={{ color: "#666" }}>{dim.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sidebar Detail Panel ─── */
function DetailPanel({
  node,
  genealogy,
  dna,
  onClose,
}: {
  node: TreeNode;
  genealogy: GenealogyData | null;
  dna: DesignDNA | null;
  onClose: () => void;
}) {
  const eraColor = getEraColor(node.era);
  const img = node.portraitUrl || node.imageUrl;

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5"
      style={{ backgroundColor: "#111111", borderLeft: "1px solid #222222" }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0"
            style={{ border: `2px solid ${eraColor}`, backgroundColor: "#0A0A0A", color: "white" }}>
            {img ? <img src={img} alt={node.name} className="w-full h-full object-cover" /> : getInitials(node.name)}
          </div>
          <div>
            <Link href={`/architects/${node.slug}`} className="text-sm font-semibold hover:underline" style={{ color: "white" }}>
              {node.name}
            </Link>
            <div className="text-xs" style={{ color: eraColor }}>{node.era || "Unknown"}</div>
            {node.bornYear && (
              <div className="text-xs" style={{ color: "#666" }}>
                {node.bornYear}{node.diedYear ? `–${node.diedYear}` : "–present"}
              </div>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="w-4 h-4" style={{ color: "#666" }} /></button>
      </div>

      {/* Design DNA */}
      {dna && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Design DNA</h4>
          <DesignDNARadar dna={dna} />
        </div>
      )}

      {/* Genealogy */}
      {genealogy && (
        <div className="space-y-4">
          {genealogy.mentors.length > 0 && (
            <RelationshipList title="Learned From" items={genealogy.mentors} color="#FFD700" />
          )}
          {genealogy.mentees.length > 0 && (
            <RelationshipList title="Mentored" items={genealogy.mentees} color="#00FF85" />
          )}
          {genealogy.influencedBy.length > 0 && (
            <RelationshipList title="Influenced By" items={genealogy.influencedBy} color="#4169E1" />
          )}
          {genealogy.influenced.length > 0 && (
            <RelationshipList title="Influenced" items={genealogy.influenced} color="#9333EA" />
          )}
          {genealogy.partners.length > 0 && (
            <RelationshipList title="Partners" items={genealogy.partners} color="#f59e0b" />
          )}
        </div>
      )}

      <Link href={`/architects/${node.slug}`}
        className="block text-center text-sm py-2 rounded-lg transition-all hover:scale-[1.02]"
        style={{ backgroundColor: "#00FF85", color: "#0A0A0A", fontWeight: 600 }}>
        View Full Profile
      </Link>
    </div>
  );
}

function RelationshipList({ title, items, color }: { title: string; items: any[]; color: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>{title}</h4>
      <div className="space-y-1.5">
        {items.map((item: any) => (
          <Link key={item.relationshipId} href={`/architects/${item.architect.slug}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-white/5"
            style={{ border: "1px solid #222222" }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs font-medium truncate" style={{ color: "white" }}>{item.architect.name}</span>
            <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: "#666" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Era Legend ─── */
function EraLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(ERA_COLORS).map(([era, color]) => (
        <div key={era} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{era}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Lineage Paths ─── */
function LineagePaths({ edges, nodes }: { edges: TreeEdge[]; nodes: TreeNode[] }) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build lineage chains from mentor relationships
  const mentorEdges = edges.filter((e) => e.type === "mentored");
  const chains: TreeNode[][] = [];

  // Find root mentors (those who don't appear as "to" in any mentor relationship)
  const menteeIds = new Set(mentorEdges.map((e) => e.to));
  const mentorIds = new Set(mentorEdges.map((e) => e.from));
  const roots = [...mentorIds].filter((id) => !menteeIds.has(id));

  function buildChain(fromId: number, path: TreeNode[]): void {
    const node = nodeMap.get(fromId);
    if (!node) return;
    const newPath = [...path, node];
    const children = mentorEdges.filter((e) => e.from === fromId);
    if (children.length === 0) {
      if (newPath.length > 1) chains.push(newPath);
    } else {
      for (const child of children) {
        buildChain(child.to, newPath);
      }
    }
  }

  for (const root of roots) {
    buildChain(root, []);
  }

  // Show top 5 longest chains
  const topChains = chains.sort((a, b) => b.length - a.length).slice(0, 5);

  if (topChains.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: "white" }}>Design Lineage Paths</h3>
      <p className="text-xs" style={{ color: "#9CA3AF" }}>Trace how ideas flowed through generations</p>
      {topChains.map((chain, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-wrap px-4 py-3 rounded-xl"
          style={{ backgroundColor: "#111111", border: "1px solid #222222" }}>
          {chain.map((node, j) => (
            <span key={node.id} className="flex items-center gap-1.5">
              <Link href={`/architects/${node.slug}`}
                className="text-xs font-medium hover:underline whitespace-nowrap"
                style={{ color: getEraColor(node.era) }}>
                {node.name}
              </Link>
              {j < chain.length - 1 && (
                <span style={{ color: "#444" }}>→</span>
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Era Timeline ─── */
function EraTimeline({ nodes }: { nodes: TreeNode[] }) {
  const withYears = nodes.filter((n) => n.bornYear).sort((a, b) => (a.bornYear || 0) - (b.bornYear || 0));
  if (withYears.length === 0) return null;

  const minYear = Math.min(...withYears.map((n) => n.bornYear!));
  const maxYear = Math.max(...withYears.map((n) => n.diedYear || 2026));
  const range = maxYear - minYear;

  // Group into decades
  const decades: Record<number, TreeNode[]> = {};
  for (const node of withYears) {
    const decade = Math.floor((node.bornYear || 0) / 20) * 20;
    if (!decades[decade]) decades[decade] = [];
    decades[decade].push(node);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: "white" }}>Era Timeline</h3>
      <div className="overflow-x-auto pb-2">
        <div className="relative" style={{ minWidth: "600px", height: "120px" }}>
          {/* Timeline axis */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "#333" }} />
          {/* Year markers */}
          {Array.from({ length: Math.ceil(range / 25) + 1 }, (_, i) => minYear + i * 25).map((year) => (
            <div key={year} className="absolute bottom-0"
              style={{ left: `${((year - minYear) / range) * 100}%` }}>
              <div className="w-px h-2" style={{ backgroundColor: "#444" }} />
              <div className="text-[9px] mt-1 -translate-x-1/2" style={{ color: "#666" }}>{year}</div>
            </div>
          ))}
          {/* Architect dots */}
          {withYears.map((node) => {
            const left = ((node.bornYear! - minYear) / range) * 100;
            const eraColor = getEraColor(node.era);
            return (
              <Link key={node.id} href={`/architects/${node.slug}`}
                className="absolute group"
                style={{ left: `${left}%`, bottom: "20px" }}>
                <div className="w-3 h-3 rounded-full transition-transform hover:scale-150"
                  style={{ backgroundColor: eraColor, boxShadow: `0 0 6px ${eraColor}40` }}
                  title={`${node.name} (${node.bornYear}${node.diedYear ? `–${node.diedYear}` : ""})`} />
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-2 py-1 rounded text-[9px] font-medium z-10"
                  style={{ backgroundColor: "#222", color: "white", border: "1px solid #333" }}>
                  {node.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Genealogy Page ─── */
export default function GenealogyPage() {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [edges, setEdges] = useState<TreeEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [genealogy, setGenealogy] = useState<GenealogyData | null>(null);
  const [dna, setDna] = useState<DesignDNA | null>(null);
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/architects/genealogy-tree")
      .then((r) => r.json())
      .then((data) => {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectNode = useCallback(async (node: TreeNode) => {
    setSelectedNode(node);
    setGenealogy(null);
    setDna(null);
    try {
      const [genRes, dnaRes] = await Promise.all([
        fetch(`/api/architects/${node.id}/genealogy`).then((r) => r.json()),
        fetch(`/api/architects/${node.id}/design-dna`).then((r) => r.json()).catch(() => null),
      ]);
      setGenealogy(genRes.architect ? genRes : null);
      setDna(dnaRes?.dimensions || null);
    } catch {}
  }, []);

  // Build tree layout: group architects into rows by generation
  const layoutNodes = useCallback(() => {
    if (nodes.length === 0) return [];

    // Build adjacency from mentor edges
    const mentorEdges = edges.filter((e) => e.type === "mentored");
    const childrenOf = new Map<number, number[]>();
    const hasParent = new Set<number>();

    for (const e of mentorEdges) {
      if (!childrenOf.has(e.from)) childrenOf.set(e.from, []);
      childrenOf.get(e.from)!.push(e.to);
      hasParent.add(e.to);
    }

    // Find roots (no parent in mentored edges)
    const roots = nodes.filter((n) => !hasParent.has(n.id));
    const levels: TreeNode[][] = [];
    const placed = new Set<number>();

    function assignLevel(id: number, level: number) {
      if (placed.has(id)) return;
      placed.add(id);
      while (levels.length <= level) levels.push([]);
      const node = nodes.find((n) => n.id === id);
      if (node) levels[level].push(node);
      const children = childrenOf.get(id) || [];
      for (const child of children) {
        assignLevel(child, level + 1);
      }
    }

    // Sort roots by birth year
    const sortedRoots = roots.sort((a, b) => (a.bornYear || 0) - (b.bornYear || 0));
    for (const root of sortedRoots) {
      assignLevel(root.id, 0);
    }

    // Add unplaced nodes to last level
    const unplaced = nodes.filter((n) => !placed.has(n.id));
    if (unplaced.length > 0) {
      levels.push(unplaced);
    }

    return levels;
  }, [nodes, edges]);

  const levels = layoutNodes();

  // Filter nodes by search
  const filteredNodes = search
    ? nodes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  // Mouse handlers for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setDragging(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#00FF85", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)" }}>
            <GitBranch className="w-4 h-4" style={{ color: "#00FF85" }} />
            <span className="text-xs font-medium" style={{ color: "#00FF85" }}>Architect Genealogy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "white" }}>
            The Architecture Family Tree
          </h1>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#9CA3AF" }}>
            Trace the lineage of golf&apos;s greatest designers — from pioneers to contemporary masters.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#666" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search architects..."
                className="pl-9 pr-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: "#111111", border: "1px solid #222222", color: "white", outline: "none" }}
              />
            </div>
            <EraLegend />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
              className="p-2 rounded-lg hover:bg-white/5" style={{ color: "#9CA3AF" }}>
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs w-12 text-center tabular-nums" style={{ color: "#666" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
              className="p-2 rounded-lg hover:bg-white/5" style={{ color: "#9CA3AF" }}>
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-2 rounded-lg hover:bg-white/5" style={{ color: "#9CA3AF" }}>
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-0">
          {/* Tree Area */}
          <div className="flex-1 rounded-xl overflow-hidden relative"
            style={{ backgroundColor: "#0d0d0d", border: "1px solid #222222", minHeight: "500px" }}>
            <div
              ref={containerRef}
              className="w-full h-full overflow-hidden"
              style={{ cursor: dragging ? "grabbing" : "grab", minHeight: "500px" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center top",
                transition: dragging ? "none" : "transform 0.2s ease",
                padding: "30px",
              }}>
                {/* Search results overlay */}
                {filteredNodes && (
                  <div className="mb-6 flex flex-wrap gap-3 justify-center">
                    {filteredNodes.map((node) => (
                      <ArchitectNode key={node.id} node={node}
                        selected={selectedNode?.id === node.id}
                        onClick={() => selectNode(node)} />
                    ))}
                    {filteredNodes.length === 0 && (
                      <p className="text-sm" style={{ color: "#666" }}>No architects found</p>
                    )}
                  </div>
                )}

                {/* Tree levels */}
                {!filteredNodes && levels.map((level, li) => (
                  <div key={li} className="mb-8">
                    <div className="flex flex-wrap gap-6 justify-center">
                      {level.map((node) => (
                        <ArchitectNode key={node.id} node={node}
                          selected={selectedNode?.id === node.id}
                          onClick={() => selectNode(node)} />
                      ))}
                    </div>
                    {li < levels.length - 1 && (
                      <div className="flex justify-center my-3">
                        <div className="w-px h-6" style={{ backgroundColor: "#333" }} />
                      </div>
                    )}
                  </div>
                ))}

                {nodes.length === 0 && (
                  <div className="text-center py-20">
                    <GitBranch className="w-12 h-12 mx-auto mb-4" style={{ color: "#333" }} />
                    <p className="text-sm" style={{ color: "#666" }}>
                      No genealogy data yet. Run the seed script to populate architect relationships.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail Sidebar */}
          {selectedNode && (
            <div className="w-80 flex-shrink-0 rounded-xl overflow-hidden ml-4"
              style={{ border: "1px solid #222222", maxHeight: "700px" }}>
              <DetailPanel node={selectedNode} genealogy={genealogy} dna={dna}
                onClose={() => { setSelectedNode(null); setGenealogy(null); setDna(null); }} />
            </div>
          )}
        </div>

        {/* Era Timeline */}
        <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: "#111111", border: "1px solid #222222" }}>
          <EraTimeline nodes={nodes} />
        </div>

        {/* Lineage Paths */}
        <div className="mt-6 rounded-xl p-6" style={{ backgroundColor: "#111111", border: "1px solid #222222" }}>
          <LineagePaths edges={edges} nodes={nodes} />
        </div>
      </div>
    </div>
  );
}
