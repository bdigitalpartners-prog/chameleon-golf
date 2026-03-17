"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";

/* ─── Types ─── */

export interface POIMarker {
  id: string;
  name: string;
  type: "course" | "nearbyCourse" | "dining" | "lodging" | "attraction" | "rvPark" | "airport";
  latitude: number;
  longitude: number;
  subtitle?: string | null;
  distance?: string | null;
  url?: string | null;
  isPrimary?: boolean;
}

export interface CourseDetailMapProps {
  markers: POIMarker[];
  center: [number, number];
  zoom?: number;
  height?: string;
  showLegend?: boolean;
  showRoute?: boolean;
}

/* ─── Constants ─── */

const POI_COLORS: Record<POIMarker["type"], string> = {
  course: "#10B981",
  nearbyCourse: "#60a5fa",
  dining: "#fbbf24",
  lodging: "#c084fc",
  attraction: "#f472b6",
  rvPark: "#fb923c",
  airport: "#94a3b8",
};

const POI_LABELS: Record<POIMarker["type"], string> = {
  course: "This Course",
  nearbyCourse: "Nearby Courses",
  dining: "Dining",
  lodging: "Lodging",
  attraction: "Attractions",
  rvPark: "RV Parks",
  airport: "Airports",
};

/* ─── Marker Icons ─── */

function createPOIIcon(type: POIMarker["type"], isPrimary?: boolean): L.DivIcon {
  const color = POI_COLORS[type];
  const size = isPrimary ? 16 : 10;
  const border = isPrimary ? 3 : 2;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${border}px solid #fff;
      box-shadow:0 0 8px ${color}88;
      ${isPrimary ? "transform:scale(1.2);" : ""}
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
}

/* ─── FitBounds ─── */

function FitBounds({ markers }: { markers: POIMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length <= 1) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [markers, map]);
  return null;
}

/* ─── Component ─── */

export default function CourseDetailMap({
  markers,
  center,
  zoom = 12,
  height = "400px",
  showLegend = true,
  showRoute = false,
}: CourseDetailMapProps) {
  const validMarkers = useMemo(
    () => markers.filter((m) => m.latitude && m.longitude),
    [markers]
  );

  // Get unique types present for the legend
  const presentTypes = useMemo(() => {
    const types = new Set(validMarkers.map((m) => m.type));
    return Array.from(types);
  }, [validMarkers]);

  // Route line for trip maps
  const routePositions = useMemo(() => {
    if (!showRoute) return [];
    return validMarkers
      .filter((m) => m.type === "course" || m.type === "nearbyCourse")
      .map((m) => [m.latitude, m.longitude] as [number, number]);
  }, [validMarkers, showRoute]);

  if (validMarkers.length === 0) {
    return (
      <div
        style={{
          height,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--cg-bg-secondary)",
          borderRadius: "0.75rem",
          border: "1px solid var(--cg-border)",
        }}
      >
        <p style={{ color: "var(--cg-text-muted)", fontSize: "14px" }}>
          No location data available
        </p>
      </div>
    );
  }

  return (
    <div style={{ height, width: "100%", position: "relative", borderRadius: "0.75rem", overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#0a0f0d" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {validMarkers.length > 1 && <FitBounds markers={validMarkers} />}

        {showRoute && routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#10B981",
              weight: 2,
              opacity: 0.6,
              dashArray: "8, 8",
            }}
          />
        )}

        {validMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={createPOIIcon(marker.type, marker.isPrimary)}
          >
            <Popup>
              <div
                style={{
                  background: "#141414",
                  color: "#f5f5f5",
                  padding: "12px",
                  borderRadius: "8px",
                  minWidth: "180px",
                  border: "1px solid #262626",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "2px" }}>
                  {marker.name}
                </div>
                {marker.subtitle && (
                  <div style={{ fontSize: "11px", color: "#a3a3a3", marginBottom: "4px" }}>
                    {marker.subtitle}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "1px 6px",
                      borderRadius: "9999px",
                      background: POI_COLORS[marker.type] + "22",
                      color: POI_COLORS[marker.type],
                      border: `1px solid ${POI_COLORS[marker.type]}44`,
                    }}
                  >
                    {POI_LABELS[marker.type]}
                  </span>
                  {marker.distance && (
                    <span style={{ fontSize: "11px", color: "#a3a3a3" }}>
                      {marker.distance}
                    </span>
                  )}
                </div>
                {marker.url && (
                  <a
                    href={marker.url}
                    style={{ color: "#4ade80", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                  >
                    {marker.type === "course" || marker.type === "nearbyCourse" ? "View Course →" : "Details →"}
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      {showLegend && presentTypes.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            background: "rgba(20,20,20,0.92)",
            border: "1px solid #262626",
            borderRadius: "8px",
            padding: "8px 12px",
            zIndex: 1000,
            fontSize: "11px",
          }}
        >
          {presentTypes.map((type) => (
            <div
              key={type}
              style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: POI_COLORS[type],
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#a3a3a3" }}>{POI_LABELS[type]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
