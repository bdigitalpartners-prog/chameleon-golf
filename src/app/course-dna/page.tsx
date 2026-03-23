import { Metadata } from "next";
import { CourseDnaExplorer } from "./CourseDnaExplorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Course DNA Fingerprint — golfEQUALIZER",
  description:
    "Every course has a unique genetic code. Explore 12-dimension DNA fingerprints, compare courses, and find courses with similar DNA.",
};

export default function CourseDnaPage() {
  return <CourseDnaExplorer />;
}
