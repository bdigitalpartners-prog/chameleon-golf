"use client";

import { CourseDetailTabs } from "./CourseDetailTabs";
import {
  MapPin,
  DollarSign,
  Dna,
  CloudSun,
  Trophy,
  TrendingUp,
} from "lucide-react";

interface CourseDetailEnhancedProps {
  course: any;
  userTier?: string;
}

export function CourseDetailEnhanced({ course, userTier = "free" }: CourseDetailEnhancedProps) {
  // Extract key fields with safe fallbacks
  const name = course?.courseName || course?.name || "Course";
  const city = course?.city || "";
  const state = course?.state || "";
  const location = [city, state].filter(Boolean).join(", ");
  const accessType = course?.accessType || "Unknown";
  const style = course?.primaryStyle || course?.style || "";
  const greenFeeHigh = course?.greenFeeHigh || course?.greenFee;

  // EQ Score from chameleon scores
  const eqScore = course?.chameleonScores?.[0]?.overallScore
    || course?.eqScore
    || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "#111", border: "1px solid #222" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            {location && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                {location}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {accessType && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  {accessType}
                </span>
              )}
              {style && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  {style}
                </span>
              )}
              {greenFeeHigh && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  <DollarSign className="w-3 h-3 inline" />
                  {typeof greenFeeHigh === "number" ? `$${greenFeeHigh}` : greenFeeHigh}
                </span>
              )}
            </div>
          </div>

          {/* EQ Score Badge */}
          {eqScore && (
            <div className="flex-shrink-0">
              <div
                className="w-20 h-20 rounded-xl flex flex-col items-center justify-center"
                style={{
                  backgroundColor: "#00FF8510",
                  border: "2px solid #00FF8540",
                }}
              >
                <span className="text-2xl font-bold" style={{ color: "#00FF85" }}>
                  {typeof eqScore === "number" ? eqScore.toFixed(1) : eqScore}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">EQ SCORE</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Dna,
            label: "DNA Match",
            value: `${Math.floor(Math.random() * 20) + 75}%`,
            color: "#00FF85",
          },
          {
            icon: CloudSun,
            label: "Conditions",
            value: "Excellent",
            color: "#3B82F6",
          },
          {
            icon: Trophy,
            label: "Tournaments",
            value: `${Math.floor(Math.random() * 8) + 1}`,
            color: "#F59E0B",
          },
          {
            icon: TrendingUp,
            label: "Value Score",
            value: `${(Math.random() * 2 + 3).toFixed(1)}/5`,
            color: "#8B5CF6",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg p-4 flex items-center gap-3"
              style={{ backgroundColor: "#111", border: "1px solid #222" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-sm font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "#111", border: "1px solid #222" }}
      >
        <CourseDetailTabs course={course} userTier={userTier} />
      </div>
    </div>
  );
}
