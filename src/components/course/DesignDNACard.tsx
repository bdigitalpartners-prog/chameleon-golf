"use client";

interface DesignDNA {
  designStyle: string | null;
  bunkeringStyle: string | null;
  greenComplexity: number | null;
  greenSpeed: string | null;
  fairwayWidth: string | null;
  elevationChange: string | null;
  waterFeatures: string | null;
  treeDensity: string | null;
  windExposure: string | null;
  walkability: string | null;
  constructionMethod: string | null;
}

const DNA_FIELDS: {
  key: keyof DesignDNA;
  label: string;
  icon: string;
  type: "tag" | "bar" | "text";
  maxValue?: number;
}[] = [
  { key: "designStyle", label: "Design Style", icon: "🏗️", type: "tag" },
  { key: "bunkeringStyle", label: "Bunkering", icon: "⛳", type: "tag" },
  { key: "greenComplexity", label: "Green Complexity", icon: "🎯", type: "bar", maxValue: 10 },
  { key: "greenSpeed", label: "Green Speed", icon: "⚡", type: "text" },
  { key: "fairwayWidth", label: "Fairway Width", icon: "🌿", type: "tag" },
  { key: "elevationChange", label: "Elevation", icon: "⛰️", type: "tag" },
  { key: "waterFeatures", label: "Water Features", icon: "💧", type: "tag" },
  { key: "treeDensity", label: "Tree Density", icon: "🌲", type: "tag" },
  { key: "windExposure", label: "Wind Exposure", icon: "🌬️", type: "tag" },
  { key: "walkability", label: "Walkability", icon: "🚶", type: "tag" },
  { key: "constructionMethod", label: "Construction", icon: "🔧", type: "text" },
];

function getIntensityColor(value: string | null): string {
  if (!value) return "var(--cg-text-muted)";
  const lower = value.toLowerCase();
  if (
    lower.includes("extreme") ||
    lower.includes("dramatic") ||
    lower.includes("dense") ||
    lower.includes("significant") ||
    lower.includes("very challenging")
  )
    return "#f87171";
  if (
    lower.includes("moderate") ||
    lower.includes("scattered") ||
    lower.includes("challenging")
  )
    return "#fbbf24";
  if (
    lower.includes("gentle") ||
    lower.includes("minimal") ||
    lower.includes("sheltered") ||
    lower.includes("easy") ||
    lower.includes("narrow")
  )
    return "#4ade80";
  return "var(--cg-accent)";
}

export function DesignDNACard({ dna }: { dna: DesignDNA }) {
  const hasData = DNA_FIELDS.some((f) => dna[f.key] !== null && dna[f.key] !== undefined);
  if (!hasData) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DNA_FIELDS.map((field) => {
        const value = dna[field.key];
        if (value === null || value === undefined) return null;

        return (
          <div
            key={field.key}
            className="rounded-lg p-3"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">{field.icon}</span>
              <span
                className="text-[11px] font-medium uppercase tracking-wide"
                style={{ color: "var(--cg-text-muted)" }}
              >
                {field.label}
              </span>
            </div>

            {field.type === "bar" && typeof value === "number" ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(value / (field.maxValue || 10)) * 100}%`,
                      backgroundColor: "var(--cg-accent)",
                      boxShadow: "0 0 6px var(--cg-accent-glow)",
                    }}
                  />
                </div>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {value}/{field.maxValue || 10}
                </span>
              </div>
            ) : field.type === "tag" ? (
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--cg-bg-primary)",
                  color: getIntensityColor(String(value)),
                  border: `1px solid ${getIntensityColor(String(value))}30`,
                }}
              >
                {String(value)}
              </span>
            ) : (
              <span
                className="text-sm"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                {String(value)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact version for architect profile pages — shows aggregated design DNA patterns
 */
export function DesignDNASummary({ dnaList }: { dnaList: DesignDNA[] }) {
  if (!dnaList || dnaList.length === 0) return null;

  // Aggregate common traits
  const styleCounts: Record<string, number> = {};
  const bunkerCounts: Record<string, number> = {};
  const traitCounts: Record<string, number> = {};
  let totalGreenComplexity = 0;
  let greenComplexityCount = 0;

  for (const dna of dnaList) {
    if (dna.designStyle) styleCounts[dna.designStyle] = (styleCounts[dna.designStyle] || 0) + 1;
    if (dna.bunkeringStyle) bunkerCounts[dna.bunkeringStyle] = (bunkerCounts[dna.bunkeringStyle] || 0) + 1;
    if (dna.greenComplexity) {
      totalGreenComplexity += dna.greenComplexity;
      greenComplexityCount++;
    }
    for (const key of ["fairwayWidth", "elevationChange", "waterFeatures", "walkability"] as const) {
      if (dna[key]) {
        const label = `${DNA_FIELDS.find((f) => f.key === key)?.label}: ${dna[key]}`;
        traitCounts[label] = (traitCounts[label] || 0) + 1;
      }
    }
  }

  const topStyles = Object.entries(styleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topBunkers = Object.entries(bunkerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topTraits = Object.entries(traitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const avgComplexity = greenComplexityCount > 0 ? Math.round(totalGreenComplexity / greenComplexityCount) : null;

  return (
    <div className="space-y-4">
      {topStyles.length > 0 && (
        <div>
          <h4
            className="text-xs font-medium uppercase tracking-wide mb-2"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Preferred Styles
          </h4>
          <div className="flex flex-wrap gap-2">
            {topStyles.map(([style, count]) => (
              <span
                key={style}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "var(--cg-accent-bg)",
                  color: "var(--cg-accent)",
                  border: "1px solid var(--cg-accent-muted)",
                }}
              >
                {style}
                {count > 1 && (
                  <span className="ml-1 opacity-60">({count})</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {topBunkers.length > 0 && (
        <div>
          <h4
            className="text-xs font-medium uppercase tracking-wide mb-2"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Bunkering Style
          </h4>
          <div className="flex flex-wrap gap-2">
            {topBunkers.map(([style, count]) => (
              <span
                key={style}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "var(--cg-bg-secondary)",
                  color: "var(--cg-text-secondary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                {style}
                {count > 1 && (
                  <span className="ml-1 opacity-60">({count})</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {avgComplexity !== null && (
        <div>
          <h4
            className="text-xs font-medium uppercase tracking-wide mb-2"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Avg Green Complexity
          </h4>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[120px]"
              style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(avgComplexity / 10) * 100}%`,
                  backgroundColor: "var(--cg-accent)",
                }}
              />
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              {avgComplexity}/10
            </span>
          </div>
        </div>
      )}

      {topTraits.length > 0 && (
        <div>
          <h4
            className="text-xs font-medium uppercase tracking-wide mb-2"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Common Traits
          </h4>
          <div className="flex flex-wrap gap-2">
            {topTraits.map(([trait, count]) => (
              <span
                key={trait}
                className="rounded-full px-2.5 py-0.5 text-[11px]"
                style={{
                  backgroundColor: "var(--cg-bg-secondary)",
                  color: "var(--cg-text-secondary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
