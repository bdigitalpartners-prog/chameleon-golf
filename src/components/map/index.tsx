"use client";

import dynamic from "next/dynamic";
import type { CourseMapProps, CourseMapItem } from "./CourseMap";

const CourseMap = dynamic(() => import("./CourseMap"), {
  ssr: false,
  loading: () => (
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
  ),
});

export default CourseMap;
export type { CourseMapProps, CourseMapItem };
