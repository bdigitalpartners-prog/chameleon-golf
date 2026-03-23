"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState } from "react";

interface DnaDimension {
  key: string;
  label: string;
  value: number;
  description?: string;
}

interface CourseProfile {
  courseId: number;
  courseName: string;
  dimensions: DnaDimension[];
  color?: string;
}

interface DnaRadarChartProps {
  courses: CourseProfile[];
}

const CHART_COLORS = ["#00FF85", "#3B82F6", "#F59E0B", "#EF4444"];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div
      className="rounded-lg px-4 py-3 shadow-xl text-sm max-w-[280px]"
      style={{
        backgroundColor: "#1A1A1A",
        border: "1px solid #333",
      }}
    >
      <p className="font-semibold text-white mb-1">{data.label}</p>
      {data.description && (
        <p className="text-[#9CA3AF] text-xs mb-2 leading-relaxed">{data.description}</p>
      )}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#9CA3AF] text-xs">{entry.name}:</span>
          <span className="text-white font-medium text-xs">{entry.value}/100</span>
        </div>
      ))}
    </div>
  );
}

export function DnaRadarChart({ courses }: DnaRadarChartProps) {
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);

  if (!courses.length) return null;

  // Build radar data from first course's dimensions as base
  const baseDimensions = courses[0].dimensions;
  const radarData = baseDimensions.map((dim) => {
    const entry: Record<string, any> = {
      label: dim.label,
      description: dim.description,
    };
    courses.forEach((course) => {
      const found = course.dimensions.find((d) => d.key === dim.key);
      entry[course.courseName] = found?.value ?? 0;
    });
    return entry;
  });

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid
            stroke="#333"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="label"
            tick={{
              fill: "#9CA3AF",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#666", fontSize: 10 }}
            tickCount={5}
            stroke="#333"
          />
          {courses.map((course, index) => {
            const color = course.color || CHART_COLORS[index % CHART_COLORS.length];
            const isHovered = hoveredCourse === course.courseName;
            const isOtherHovered = hoveredCourse && !isHovered;
            return (
              <Radar
                key={course.courseId}
                name={course.courseName}
                dataKey={course.courseName}
                stroke={color}
                fill={color}
                fillOpacity={isOtherHovered ? 0.03 : isHovered ? 0.3 : 0.15}
                strokeWidth={isHovered ? 3 : 2}
                strokeOpacity={isOtherHovered ? 0.3 : 1}
                onMouseEnter={() => setHoveredCourse(course.courseName)}
                onMouseLeave={() => setHoveredCourse(null)}
              />
            );
          })}
          <Tooltip content={<CustomTooltip />} />
          {courses.length > 1 && (
            <Legend
              wrapperStyle={{ color: "#9CA3AF", fontSize: 12, paddingTop: 12 }}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
