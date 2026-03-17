"use client";

import { Sun, CloudRain, Wind, Droplets, Thermometer, Calendar } from "lucide-react";

interface MonthWeatherData {
  month: number;
  avgHighF: number | string;
  avgLowF: number | string;
  avgPrecipInches: number | string;
  avgPrecipDays: number | string;
  avgSunnyDays: number | string;
  humidity: number | string;
  windSpeedMph: number | string;
  playabilityScore: number | string;
  bestTimeOfDay?: string | null;
}

interface WeatherPlayabilityCalendarProps {
  months: MonthWeatherData[];
  bestMonths?: number[] | null;
  compact?: boolean;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getPlayabilityColor(score: number): string {
  if (score >= 80) return "#22c55e"; // green
  if (score >= 65) return "#84cc16"; // lime
  if (score >= 50) return "#eab308"; // yellow
  if (score >= 35) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getPlayabilityBg(score: number): string {
  if (score >= 80) return "rgba(34,197,94,0.15)";
  if (score >= 65) return "rgba(132,204,22,0.15)";
  if (score >= 50) return "rgba(234,179,8,0.15)";
  if (score >= 35) return "rgba(249,115,22,0.15)";
  return "rgba(239,68,68,0.15)";
}

function getPlayabilityLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Poor";
  return "Avoid";
}

export function WeatherPlayabilityCalendar({ months, bestMonths, compact }: WeatherPlayabilityCalendarProps) {
  if (!months || months.length === 0) return null;

  const sorted = [...months].sort((a, b) => Number(a.month) - Number(b.month));

  // Find best months from data if not provided
  const computedBest = bestMonths || sorted
    .filter((m) => Number(m.playabilityScore) >= 70)
    .map((m) => Number(m.month));

  return (
    <div className="space-y-4">
      {/* Best Months Badge */}
      {computedBest.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cg-text-muted)" }}>
            Best months:
          </span>
          {computedBest.map((m) => (
            <span
              key={m}
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              {MONTH_LABELS[(Number(m) - 1)] || m}
            </span>
          ))}
        </div>
      )}

      {/* 12-Month Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
        {sorted.map((m) => {
          const score = Number(m.playabilityScore);
          const color = getPlayabilityColor(score);
          const bg = getPlayabilityBg(score);
          return (
            <div
              key={m.month}
              className="relative rounded-lg p-2 text-center transition-all hover:scale-105 cursor-default group"
              style={{
                backgroundColor: bg,
                border: `1px solid ${color}33`,
              }}
              title={`${MONTH_LABELS[Number(m.month) - 1]}: ${score}/100 - ${getPlayabilityLabel(score)}`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--cg-text-muted)" }}>
                {MONTH_LABELS[Number(m.month) - 1]}
              </div>
              <div className="text-lg font-bold tabular-nums" style={{ color }}>
                {score}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
                {Math.round(Number(m.avgHighF))}°/{Math.round(Number(m.avgLowF))}°
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
          Excellent (80+)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#84cc16" }} />
          Good (65-79)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#eab308" }} />
          Fair (50-64)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#f97316" }} />
          Poor (35-49)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          Avoid (&lt;35)
        </span>
      </div>

      {/* Detailed Monthly Breakdown (non-compact) */}
      {!compact && (
        <div className="space-y-1.5 mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--cg-text-muted)" }}>
            Monthly Details
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: "var(--cg-text-secondary)" }}>
              <thead>
                <tr style={{ color: "var(--cg-text-muted)" }}>
                  <th className="text-left py-1.5 px-2 font-semibold">Month</th>
                  <th className="text-center py-1.5 px-2 font-semibold">
                    <Thermometer className="h-3 w-3 inline mr-0.5" />Hi/Lo
                  </th>
                  <th className="text-center py-1.5 px-2 font-semibold">
                    <CloudRain className="h-3 w-3 inline mr-0.5" />Rain
                  </th>
                  <th className="text-center py-1.5 px-2 font-semibold">
                    <Sun className="h-3 w-3 inline mr-0.5" />Sun
                  </th>
                  <th className="text-center py-1.5 px-2 font-semibold">
                    <Wind className="h-3 w-3 inline mr-0.5" />Wind
                  </th>
                  <th className="text-center py-1.5 px-2 font-semibold">
                    <Droplets className="h-3 w-3 inline mr-0.5" />Hum.
                  </th>
                  <th className="text-center py-1.5 px-2 font-semibold">Score</th>
                  <th className="text-left py-1.5 px-2 font-semibold">Best Time</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => {
                  const score = Number(m.playabilityScore);
                  const color = getPlayabilityColor(score);
                  return (
                    <tr
                      key={m.month}
                      className="border-t"
                      style={{ borderColor: "var(--cg-border)" }}
                    >
                      <td className="py-1.5 px-2 font-medium" style={{ color: "var(--cg-text-primary)" }}>
                        {MONTH_LABELS[Number(m.month) - 1]}
                      </td>
                      <td className="text-center py-1.5 px-2 tabular-nums">
                        {Math.round(Number(m.avgHighF))}° / {Math.round(Number(m.avgLowF))}°
                      </td>
                      <td className="text-center py-1.5 px-2 tabular-nums">
                        {Number(m.avgPrecipInches).toFixed(1)}&quot; ({m.avgPrecipDays}d)
                      </td>
                      <td className="text-center py-1.5 px-2 tabular-nums">
                        {m.avgSunnyDays}d
                      </td>
                      <td className="text-center py-1.5 px-2 tabular-nums">
                        {Number(m.windSpeedMph).toFixed(0)} mph
                      </td>
                      <td className="text-center py-1.5 px-2 tabular-nums">
                        {m.humidity}%
                      </td>
                      <td className="text-center py-1.5 px-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
                          style={{ backgroundColor: `${color}22`, color }}
                        >
                          {score}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
                        {m.bestTimeOfDay || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact best-months badge for use in cards/headers.
 */
export function BestMonthsBadge({ bestMonths }: { bestMonths?: number[] | null }) {
  if (!bestMonths || bestMonths.length === 0) return null;

  const labels = bestMonths.slice(0, 4).map((m) => MONTH_LABELS[Number(m) - 1]).filter(Boolean);
  const hasMore = bestMonths.length > 4;

  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-3.5 w-3.5" style={{ color: "#22c55e" }} />
      <span className="text-xs font-medium" style={{ color: "#22c55e" }}>
        Best: {labels.join(", ")}{hasMore ? ` +${bestMonths.length - 4}` : ""}
      </span>
    </div>
  );
}
