import { Metadata } from "next";
import { AerationTracker } from "./AerationTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aeration Tracker — golfEQUALIZER",
  description:
    "Track course aeration schedules. Know which greens are recovering before you book your tee time.",
};

export default function AerationPage() {
  return <AerationTracker />;
}
