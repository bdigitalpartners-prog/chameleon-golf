import { Metadata } from "next";
import { ConditionsHub } from "./ConditionsHub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Course Conditions — golfEQUALIZER",
  description:
    "Real-time crowdsourced course conditions. See green speeds, fairway quality, and pace of play reported by golfers like you.",
};

export default function ConditionsPage() {
  return <ConditionsHub />;
}
