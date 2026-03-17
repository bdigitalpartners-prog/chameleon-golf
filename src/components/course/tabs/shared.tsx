"use client";

import { Clock, Calendar, Lightbulb, Map, Flag, Compass, DollarSign } from "lucide-react";

/* ─── Safe Text Helper ─── */
export function safeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value);
  if (str === "undefined" || str === "null" || str.trim() === "") return null;
  return str;
}

/* ─── Empty State ─── */
export function EmptyState({ icon, title, description, cta }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
        style={{ backgroundColor: "var(--cg-bg-tertiary)", border: "1px solid var(--cg-border)" }}
      >
        <span style={{ color: "var(--cg-text-muted)" }}>{icon}</span>
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--cg-text-secondary)" }}>{title}</p>
      {description && (
        <p className="mt-1.5 text-xs max-w-xs" style={{ color: "var(--cg-text-muted)" }}>{description}</p>
      )}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

/* ─── Coming Soon State ─── */
export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
        style={{ backgroundColor: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)" }}
      >
        <span style={{ color: "#00E676" }}>✦</span>
      </div>
      <p className="text-sm font-semibold" style={{ color: "#00E676" }}>{title}</p>
      {description && (
        <p className="mt-1.5 text-xs max-w-sm" style={{ color: "var(--cg-text-muted)" }}>{description}</p>
      )}
    </div>
  );
}

/* ─── Last Updated ─── */
export function LastUpdated({ date }: { date: string | Date | null | undefined }) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const relative = getRelativeTime(d);
  return (
    <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--cg-text-muted)" }}>
      <Clock className="h-2.5 w-2.5" />
      Updated {relative}
    </span>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

/* ─── Shared Styles ─── */
export const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};

export const sectionTitle: React.CSSProperties = { color: "var(--cg-text-primary)" };
export const mutedText: React.CSSProperties = { color: "var(--cg-text-muted)" };
export const secondaryText: React.CSSProperties = { color: "var(--cg-text-secondary)" };
export const primaryText: React.CSSProperties = { color: "var(--cg-text-primary)" };

/* ─── Tier Badge ─── */
export function tierBadgeStyle(tier: string): React.CSSProperties {
  switch (tier) {
    case "flagship":
      return { backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" };
    case "major":
      return { backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)" };
    case "specialty":
      return { backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" };
    default:
      return { backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)", border: "1px solid var(--cg-border)" };
  }
}

export function accessBadgeStyle(access: string): React.CSSProperties {
  const lower = (access || "").toLowerCase();
  if (lower.includes("private"))
    return { backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" };
  if (lower.includes("resort"))
    return { backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" };
  return { backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" };
}

/* ─── Section Heading ─── */
export function SectionHeading({ icon, children, lastUpdated }: { icon?: React.ReactNode; children: React.ReactNode; lastUpdated?: string | Date | null }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-xl font-semibold flex items-center gap-2" style={sectionTitle}>
        {icon}
        {children}
      </h2>
      {lastUpdated && <LastUpdated date={lastUpdated} />}
    </div>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2" style={sectionTitle}>
      {children}
    </h3>
  );
}

/* ─── Info Row helper ─── */
export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined) return null;
  const display = typeof value === "string" ? safeText(value) : value;
  if (display === null) return null;
  return (
    <div>
      <dt className="mb-0.5 text-xs" style={mutedText}>{label}</dt>
      <dd className="font-medium text-sm" style={primaryText}>{display}</dd>
    </div>
  );
}

/* ─── Score Dimension Bar ─── */
export function ScoreDimRow({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs" style={mutedText}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--cg-accent)" }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums" style={primaryText}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── Intelligence Note Card ─── */
const NOTE_ICONS: Record<string, React.ReactNode> = {
  Calendar: <Calendar className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Map: <Map className="h-4 w-4" />,
  Flag: <Flag className="h-4 w-4" />,
  Compass: <Compass className="h-4 w-4" />,
  DollarSign: <DollarSign className="h-4 w-4" />,
};

export function IntelligenceNoteCard({ note }: { note: { id: number; category: string; title: string; content: string; icon?: string | null } }) {
  const icon = note.icon ? NOTE_ICONS[note.icon] || <Lightbulb className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />;

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        backgroundColor: "var(--cg-bg-secondary)",
        border: "1px solid var(--cg-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--cg-accent)" }}>{icon}</span>
        <h4 className="text-sm font-semibold" style={primaryText}>{note.title}</h4>
      </div>
      <p className="text-xs leading-relaxed" style={secondaryText}>{note.content}</p>
    </div>
  );
}

/* ─── Radar Chart ─── */
export const RADAR_DIMENSIONS = [
  { key: "avgConditioning", label: "Cond.", fullLabel: "Conditioning" },
  { key: "avgLayoutDesign", label: "Layout", fullLabel: "Layout & Design" },
  { key: "avgAesthetics", label: "Aesth.", fullLabel: "Aesthetics" },
  { key: "avgChallenge", label: "Challenge", fullLabel: "Challenge" },
  { key: "avgValue", label: "Value", fullLabel: "Value" },
  { key: "avgWalkability", label: "Walk.", fullLabel: "Walkability" },
  { key: "avgPace", label: "Pace", fullLabel: "Pace" },
  { key: "avgAmenities", label: "Amen.", fullLabel: "Amenities" },
  { key: "avgService", label: "Service", fullLabel: "Service" },
];

export function RadarChart({ scores }: { scores: Record<string, number> }) {
  const n = RADAR_DIMENSIONS.length;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;

  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, radius: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPath = (level: number) => {
    const pts = RADAR_DIMENSIONS.map((_, i) => getPoint(i, level * r));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";
  };

  const dataPath = () => {
    const pts = RADAR_DIMENSIONS.map((dim, i) => {
      const val = scores[dim.key] ?? 0;
      return getPoint(i, (val / 10) * r);
    });
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";
  };

  const hasData = RADAR_DIMENSIONS.some((d) => (scores[d.key] ?? 0) > 0);
  if (!hasData) return null;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[220px] mx-auto">
      {gridLevels.map((level) => (
        <path key={level} d={gridPath(level)} fill="none" stroke="var(--cg-border)" strokeWidth="0.5" />
      ))}
      {RADAR_DIMENSIONS.map((_, i) => {
        const pt = getPoint(i, r);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="var(--cg-border)" strokeWidth="0.5" />;
      })}
      <path d={dataPath()} fill="rgba(34,197,94,0.2)" stroke="var(--cg-accent)" strokeWidth="1.5" />
      {RADAR_DIMENSIONS.map((dim, i) => {
        const pt = getPoint(i, r + 16);
        return (
          <text key={dim.key} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="var(--cg-text-muted)">
            {dim.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Hole Card ─── */
export function HoleCard({ title, holeData, accent }: { title: string; holeData: any; accent: string }) {
  if (!holeData) return null;
  const hole = typeof holeData === "object" ? holeData : null;
  if (!hole) return null;
  return (
    <div className="rounded-xl p-4" style={{
      backgroundColor: "var(--cg-bg-secondary)",
      border: `1px solid ${accent}33`,
    }}>
      <div className="flex items-center gap-2 mb-2">
        <Flag className="h-4 w-4" style={{ color: accent }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>{title}</span>
      </div>
      {hole.hole && (
        <div className="text-lg font-bold mb-1" style={primaryText}>Hole {hole.hole}</div>
      )}
      {hole.notes && (
        <p className="text-sm leading-relaxed" style={secondaryText}>{hole.notes}</p>
      )}
    </div>
  );
}

/* ─── Weather Chart ─── */
export function WeatherChart({ weatherData }: { weatherData: Record<string, any> }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = months.map((m) => ({ month: m, ...(weatherData[m] || {}) })).filter((d) => d.avg_high != null);
  if (data.length === 0) return null;
  const maxTemp = Math.max(...data.map((d) => d.avg_high || 0));

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {data.map((d) => {
          const highPct = maxTemp > 0 ? ((d.avg_high || 0) / maxTemp) * 100 : 0;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums" style={mutedText}>{d.avg_high ? `${Math.round(d.avg_high)}°` : ""}</span>
              <div className="w-full rounded-t" style={{
                height: `${highPct}%`,
                minHeight: 4,
                backgroundColor: "var(--cg-accent)",
                opacity: 0.7,
              }} />
              <span className="text-[9px]" style={mutedText}>{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
