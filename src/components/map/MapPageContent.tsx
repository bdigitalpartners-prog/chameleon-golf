"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CourseMap } from "@/components/map";
import type { CourseMapItem } from "@/components/map";
import {
  MapPin,
  Filter,
  X,
  Search,
  Loader2,
} from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const ACCESS_TYPES = ["Public", "Private", "Resort", "Semi-Private", "Military"];

const PRESET_QUERIES = [
  { key: "all", label: "All Courses" },
  { key: "top100", label: "Top 100" },
  { key: "top50", label: "Top 50" },
  { key: "bucket-list", label: "Bucket List" },
  { key: "hidden-gems", label: "Hidden Gems" },
  { key: "public", label: "Public Only" },
  { key: "private", label: "Private Only" },
];

export default function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [preset, setPreset] = useState(searchParams.get("query") || "all");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [access, setAccess] = useState(searchParams.get("access") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") || "");
  const [architect, setArchitect] = useState(searchParams.get("architect") || "");
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");

  const [courses, setCourses] = useState<CourseMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [highlightedCourseId, setHighlightedCourseId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (preset && preset !== "all") params.set("query", preset);
    if (state) params.set("state", state);
    if (access) params.set("access", access);
    if (priceMax) params.set("priceMax", priceMax);
    if (architect) params.set("architect", architect);
    if (searchText) params.set("search", searchText);
    return params.toString();
  }, [preset, state, access, priceMax, architect, searchText]);

  useEffect(() => {
    const qs = buildQuery();
    const newUrl = qs ? `/map?${qs}` : "/map";
    router.replace(newUrl, { scroll: false });
  }, [buildQuery, router]);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    const qs = buildQuery();
    fetch(`/api/courses/map${qs ? `?${qs}` : ""}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setCourses(data.courses || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Map fetch error:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [buildQuery]);

  const clearFilters = () => {
    setPreset("all");
    setState("");
    setAccess("");
    setPriceMax("");
    setArchitect("");
    setSearchText("");
  };

  const hasFilters = preset !== "all" || state || access || priceMax || architect || searchText;

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        backgroundColor: "#0A0F0D",
      }}
    >
      {/* Filter Sidebar */}
      <div
        style={{
          width: sidebarOpen ? "340px" : "0px",
          minWidth: sidebarOpen ? "340px" : "0px",
          transition: "all 0.3s ease",
          overflow: "hidden",
          borderRight: sidebarOpen ? "1px solid var(--cg-border)" : "none",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--cg-bg-secondary)",
        }}
      >
        <div style={{ padding: "16px", overflowY: "auto" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin
                style={{ width: "18px", height: "18px", color: "#4ade80" }}
              />
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--cg-text-primary)",
                }}
              >
                Course Map
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--cg-text-muted)",
                padding: "4px",
              }}
            >
              <X style={{ width: "18px", height: "18px" }} />
            </button>
          </div>

          {/* Results count */}
          <div
            style={{
              fontSize: "13px",
              color: "var(--cg-text-muted)",
              marginBottom: "16px",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Loader2
                  style={{
                    width: "14px",
                    height: "14px",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Loading courses...
              </span>
            ) : (
              `Showing ${courses.length} courses`
            )}
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Search
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "var(--cg-text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "8px",
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Preset Queries */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--cg-text-muted)",
                marginBottom: "8px",
              }}
            >
              Quick Filters
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {PRESET_QUERIES.map((pq) => (
                <button
                  key={pq.key}
                  onClick={() => setPreset(pq.key)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    border:
                      preset === pq.key
                        ? "1px solid #4ade80"
                        : "1px solid var(--cg-border)",
                    backgroundColor:
                      preset === pq.key
                        ? "rgba(74,222,128,0.15)"
                        : "var(--cg-bg-tertiary)",
                    color: preset === pq.key ? "#4ade80" : "var(--cg-text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {pq.label}
                </button>
              ))}
            </div>
          </div>

          {/* State Filter */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--cg-text-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">All States</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Access Type */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--cg-text-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Access Type
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {ACCESS_TYPES.map((at) => (
                <label
                  key={at}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "var(--cg-text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="accessType"
                    checked={access === at}
                    onChange={() => setAccess(access === at ? "" : at)}
                    style={{ accentColor: "#4ade80" }}
                  />
                  {at}
                </label>
              ))}
              {access && (
                <button
                  onClick={() => setAccess("")}
                  style={{
                    fontSize: "11px",
                    color: "#4ade80",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                  }}
                >
                  Clear access filter
                </button>
              )}
            </div>
          </div>

          {/* Max Price */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--cg-text-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Max Green Fee
            </label>
            <input
              type="number"
              placeholder="e.g. 200"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Architect */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--cg-text-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Architect
            </label>
            <input
              type="text"
              placeholder="e.g. Pete Dye"
              value={architect}
              onChange={(e) => setArchitect(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--cg-border)",
                backgroundColor: "transparent",
                color: "var(--cg-text-secondary)",
                fontSize: "13px",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Course List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            borderTop: "1px solid var(--cg-border)",
            minHeight: 0,
          }}
        >
          {courses.slice(0, 100).map((course) => (
            <a
              key={course.courseId}
              href={`/courses/${course.courseId}`}
              onMouseEnter={() => setHighlightedCourseId(course.courseId)}
              onMouseLeave={() => setHighlightedCourseId(null)}
              style={{
                display: "block",
                padding: "10px 16px",
                borderBottom: "1px solid var(--cg-border)",
                textDecoration: "none",
                cursor: "pointer",
                backgroundColor:
                  highlightedCourseId === course.courseId
                    ? "var(--cg-bg-tertiary)"
                    : "transparent",
                transition: "background-color 0.15s",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--cg-text-primary)",
                  marginBottom: "2px",
                }}
              >
                {course.courseName}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--cg-text-muted)",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <span>
                  {[course.city, course.state].filter(Boolean).join(", ")}
                </span>
                {course.accessType && (
                  <span
                    style={{
                      padding: "1px 5px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      backgroundColor: "rgba(74,222,128,0.1)",
                      color: "#4ade80",
                    }}
                  >
                    {course.accessType}
                  </span>
                )}
              </div>
            </a>
          ))}
          {courses.length > 100 && (
            <div
              style={{
                padding: "12px 16px",
                fontSize: "12px",
                color: "var(--cg-text-muted)",
                textAlign: "center",
              }}
            >
              Showing 100 of {courses.length} courses on the list. All
              {" "}{courses.length} are plotted on the map.
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: "relative" }}>
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--cg-border)",
              backgroundColor: "var(--cg-bg-card)",
              color: "var(--cg-text-primary)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <Filter style={{ width: "14px", height: "14px" }} />
            Filters
            {hasFilters && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#4ade80",
                }}
              />
            )}
          </button>
        )}
        <CourseMap
          courses={courses}
          height="100%"
          clusterMarkers={true}
          colorBy="accessType"
          highlightedCourseId={highlightedCourseId}
        />
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
