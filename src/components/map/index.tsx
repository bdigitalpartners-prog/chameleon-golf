"use client";

import dynamic from "next/dynamic";
import type { CourseMapProps, CourseMapItem } from "./CourseMap";
import type { CourseDetailMapProps, POIMarker } from "./CourseDetailMap";

const mapLoadingFallback = (
  <div
    style={{
      height: "100%",
      width: "100%",
      background: "var(--cg-bg-secondary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--cg-text-muted)",
      fontSize: "14px",
    }}
  >
    Loading map…
  </div>
);

const CourseMap = dynamic(() => import("./CourseMap"), {
  ssr: false,
  loading: () => mapLoadingFallback,
});

const CourseDetailMap = dynamic(() => import("./CourseDetailMap"), {
  ssr: false,
  loading: () => mapLoadingFallback,
});

export default CourseMap;
export { CourseDetailMap };
export type { CourseMapProps, CourseMapItem, CourseDetailMapProps, POIMarker };
