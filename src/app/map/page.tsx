import { Suspense } from "react";
import MapPageContent from "@/components/map/MapPageContent";

export const dynamic = "force-dynamic";

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: "calc(100vh - 64px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0A0F0D",
            color: "#a3a3a3",
          }}
        >
          Loading map...
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
