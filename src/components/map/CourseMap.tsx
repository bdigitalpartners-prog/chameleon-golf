"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { useEffect, useMemo } from "react";

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
  selectedCourseId?: number | null;
}

const US_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

const ACCESS_COLORS: Record<string, string> = {
  "Open to Public": "#4ade80",
  Public: "#4ade80",
  "Member Only": "#ef4444",
  Private: "#ef4444",
  "Resort Guest": "#60a5fa",
  Resort: "#60a5fa",
  "Semi-Private": "#fbbf24",
  Reciprocal: "#c084fc",
};

function createMarkerIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 14 : 10;
  const border = isSelected ? 3 : 2;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${border}px solid #fff;
      box-shadow:0 0 6px ${color}88;
      ${isSelected ? "transform:scale(1.4);" : ""}
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
}

function getMarkerColor(
  course: CourseMapItem,
  colorBy: CourseMapProps["colorBy"]
): string {
  if (colorBy === "accessType" && course.accessType) {
    return ACCESS_COLORS[course.accessType] || "#4ade80";
  }
  return "#4ade80";
}

function FitBounds({ courses }: { courses: CourseMapItem[] }) {
  const map = useMap();
  useEffect(() => {
    if (courses.length === 0) return;
    const bounds = L.latLngBounds(
      courses.map((c) => [c.latitude, c.longitude])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [courses, map]);
  return null;
}

export default function CourseMap({
  courses,
  center,
  zoom,
  height = "600px",
  onCourseSelect,
  clusterMarkers = true,
  colorBy = "accessType",
  selectedCourseId,
}: CourseMapProps) {
  const validCourses = useMemo(
    () => courses.filter((c) => c.latitude && c.longitude),
    [courses]
  );

  const markers = useMemo(
    () =>
      validCourses.map((course) => {
        const color = getMarkerColor(course, colorBy);
        const isSelected = course.courseId === selectedCourseId;
        return {
          course,
          icon: createMarkerIcon(color, isSelected),
          position: [course.latitude, course.longitude] as [number, number],
        };
      }),
    [validCourses, colorBy, selectedCourseId]
  );

  const mapCenter = center || US_CENTER;
  const mapZoom = zoom || DEFAULT_ZOOM;

  const clusterIconFn = (cluster: any) => {
    const count = cluster.getChildCount();
    const size = count < 20 ? 36 : count < 100 ? 44 : 52;
    return L.divIcon({
      html: `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:rgba(74,222,128,0.85);color:#0a0f0d;
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:${size < 40 ? 12 : 14}px;
        border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);
      ">${count}</div>`,
      className: "marker-cluster-custom",
      iconSize: L.point(size, size),
    });
  };

  const markerElements = markers.map(({ course, icon, position }) => (
    <Marker key={course.courseId} position={position} icon={icon}>
      <Popup>
        <div
          style={{
            background: "#141414",
            color: "#f5f5f5",
            padding: "12px",
            borderRadius: "8px",
            minWidth: "200px",
            border: "1px solid #262626",
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
              gap: "6px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            {course.accessType && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background:
                    (ACCESS_COLORS[course.accessType] || "#4ade80") + "22",
                  color: ACCESS_COLORS[course.accessType] || "#4ade80",
                  border: `1px solid ${ACCESS_COLORS[course.accessType] || "#4ade80"}44`,
                }}
              >
                {course.accessType}
              </span>
            )}
            {course.greenFeeHigh != null && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "rgba(255,255,255,0.08)",
                  color: "#a3a3a3",
                }}
              >
                ${course.greenFeeHigh}
              </span>
            )}
          </div>
          {course.originalArchitect && (
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
              Architect: {course.originalArchitect}
            </div>
          )}
          <a
            href={`/course/${course.courseId}`}
            style={{
              color: "#4ade80",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
            }}
            onClick={(e) => {
              if (onCourseSelect) {
                e.preventDefault();
                onCourseSelect(course);
              }
            }}
          >
            View Course →
          </a>
        </div>
      </Popup>
    </Marker>
  ));

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%", background: "#0a0f0d" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {validCourses.length > 0 && <FitBounds courses={validCourses} />}
        {clusterMarkers ? (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={clusterIconFn}
            maxClusterRadius={50}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
          >
            {markerElements}
          </MarkerClusterGroup>
        ) : (
          markerElements
        )}
      </MapContainer>

      {/* Legend */}
      {colorBy === "accessType" && (
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "12px",
            background: "rgba(20,20,20,0.92)",
            border: "1px solid #262626",
            borderRadius: "8px",
            padding: "10px 14px",
            zIndex: 1000,
            fontSize: "11px",
          }}
        >
          {Object.entries({
            "Open to Public": "#4ade80",
            "Member Only": "#ef4444",
            "Resort Guest": "#60a5fa",
            "Semi-Private": "#fbbf24",
            Reciprocal: "#c084fc",
          }).map(([label, color]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "3px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: color,
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#a3a3a3" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
