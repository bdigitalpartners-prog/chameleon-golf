"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Types ──────────────────────────────────────────────────────────
export interface CourseMapItem {
  courseId: number;
  courseName: string;
  facilityName?: string | null;
  latitude: number;
  longitude: number;
  city?: string | null;
  state?: string | null;
  courseType?: string | null;
  accessType?: string | null;
  priceTier?: string | null;
  greenFeeHigh?: number | null;
  numListsAppeared?: number | null;
  originalArchitect?: string | null;
  par?: number | null;
  numHoles?: number | null;
  overallScore?: number | null;
}

export interface CourseMapProps {
  courses: CourseMapItem[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showSearch?: boolean;
  showList?: boolean;
  onCourseSelect?: (course: CourseMapItem) => void;
  clusterMarkers?: boolean;
  colorBy?: "accessType" | "priceTier" | "state" | "rating" | "none";
  highlightedCourseId?: number | null;
}

// ── Color mapping ──────────────────────────────────────────────────
const ACCESS_COLORS: Record<string, string> = {
  Public: "#4ade80",
  Private: "#ef4444",
  Resort: "#3b82f6",
  "Semi-Private": "#f59e0b",
  Military: "#8b5cf6",
};

const DEFAULT_COLOR = "#4ade80";

function getMarkerColor(
  course: CourseMapItem,
  colorBy: CourseMapProps["colorBy"]
): string {
  if (!colorBy || colorBy === "none") return DEFAULT_COLOR;
  if (colorBy === "accessType" && course.accessType) {
    return ACCESS_COLORS[course.accessType] ?? DEFAULT_COLOR;
  }
  return DEFAULT_COLOR;
}

// ── Custom marker icon ─────────────────────────────────────────────
function createMarkerIcon(color: string, highlighted = false): L.DivIcon {
  const size = highlighted ? 16 : 12;
  const border = highlighted ? `3px solid #fff` : `2px solid rgba(0,0,0,0.4)`;
  return L.divIcon({
    className: "custom-map-marker",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${border};
      box-shadow:0 0 6px ${color}80;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 2)],
  });
}

// ── Cluster icon ───────────────────────────────────────────────────
function createClusterIcon(cluster: any): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 20 ? 36 : count < 50 ? 44 : 52;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:rgba(74,222,128,0.2);border:2px solid #4ade80;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:12px;font-weight:700;
    ">${count}</div>`,
    className: "custom-cluster-icon",
    iconSize: [size, size],
  });
}

// ── Auto-fit bounds ────────────────────────────────────────────────
function FitBounds({ courses }: { courses: CourseMapItem[] }) {
  const map = useMap();
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (courses.length === 0) return;
    // Only refit when course count changes meaningfully
    if (courses.length === prevCountRef.current) return;
    prevCountRef.current = courses.length;

    const bounds = L.latLngBounds(
      courses.map((c) => [c.latitude, c.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [courses, map]);

  return null;
}

// ── Main Component ─────────────────────────────────────────────────
export default function CourseMap({
  courses,
  center = [39.5, -98.35],
  zoom = 4,
  height = "600px",
  onCourseSelect,
  clusterMarkers = true,
  colorBy = "accessType",
  highlightedCourseId,
}: CourseMapProps) {
  const validCourses = useMemo(
    () => courses.filter((c) => c.latitude && c.longitude),
    [courses]
  );

  const markers = useMemo(
    () =>
      validCourses.map((course) => {
        const color = getMarkerColor(course, colorBy);
        const isHighlighted = course.courseId === highlightedCourseId;
        return (
          <Marker
            key={course.courseId}
            position={[course.latitude, course.longitude]}
            icon={createMarkerIcon(color, isHighlighted)}
            eventHandlers={{
              click: () => onCourseSelect?.(course),
            }}
          >
            <Popup>
              <div
                style={{
                  background: "#1a1a2e",
                  color: "#fff",
                  padding: "12px",
                  borderRadius: "8px",
                  minWidth: "200px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  {course.courseName}
                </div>
                {course.facilityName &&
                  course.facilityName !== course.courseName && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#a3a3a3",
                        marginBottom: "4px",
                      }}
                    >
                      {course.facilityName}
                    </div>
                  )}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#a3a3a3",
                    marginBottom: "8px",
                  }}
                >
                  {[course.city, course.state].filter(Boolean).join(", ")}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  {course.accessType && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background:
                          (ACCESS_COLORS[course.accessType] ?? DEFAULT_COLOR) +
                          "30",
                        color:
                          ACCESS_COLORS[course.accessType] ?? DEFAULT_COLOR,
                        fontWeight: 600,
                      }}
                    >
                      {course.accessType}
                    </span>
                  )}
                  {course.greenFeeHigh != null && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.1)",
                        color: "#a3a3a3",
                      }}
                    >
                      ${course.greenFeeHigh}
                    </span>
                  )}
                  {course.numHoles && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.1)",
                        color: "#a3a3a3",
                      }}
                    >
                      {course.numHoles} holes
                    </span>
                  )}
                </div>
                {course.originalArchitect && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#a3a3a3",
                      marginBottom: "8px",
                    }}
                  >
                    Architect: {course.originalArchitect}
                  </div>
                )}
                <a
                  href={`/courses/${course.courseId}`}
                  style={{
                    display: "inline-block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#4ade80",
                    textDecoration: "none",
                  }}
                >
                  View Course &rarr;
                </a>
              </div>
            </Popup>
          </Marker>
        );
      }),
    [validCourses, colorBy, highlightedCourseId, onCourseSelect]
  );

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#0A0F0D" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds courses={validCourses} />
        {clusterMarkers ? (
          <MarkerClusterGroup
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {markers}
          </MarkerClusterGroup>
        ) : (
          markers
        )}
      </MapContainer>
      {/* Global style overrides for leaflet popups */}
      <style jsx global>{`
        .custom-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-cluster-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: #1a1a2e !important;
          border-radius: 8px !important;
          border: 1px solid #262626 !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-tip {
          background: #1a1a2e !important;
          border: 1px solid #262626 !important;
        }
        .leaflet-popup-close-button {
          color: #a3a3a3 !important;
          font-size: 18px !important;
          padding: 4px 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #fff !important;
        }
        .leaflet-control-zoom a {
          background: #1a1a2e !important;
          color: #fff !important;
          border-color: #262626 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #262626 !important;
        }
        .leaflet-control-attribution {
          background: rgba(10, 15, 13, 0.8) !important;
          color: #666 !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #4ade80 !important;
        }
      `}</style>
    </div>
  );
}
