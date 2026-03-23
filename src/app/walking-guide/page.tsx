import { Metadata } from "next";
import { WalkingGuideHub } from "./WalkingGuideHub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Walking Golfer's Guide — golfEQUALIZER",
  description:
    "Find walkable golf courses near you. Filter by terrain, state, cart policy, and accessibility features.",
};

export default function WalkingGuidePage() {
  return <WalkingGuideHub />;
}
