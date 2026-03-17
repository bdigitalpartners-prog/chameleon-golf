import dynamic from "next/dynamic";

export type { CourseMapItem, CourseMapProps } from "./CourseMap";

export const CourseMap = dynamic(() => import("./CourseMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0F0D",
        color: "#a3a3a3",
        fontSize: "14px",
      }}
    >
      Loading map...
    </div>
  ),
});
