import { Metadata } from "next";
import { TournamentsHub } from "./TournamentsHub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournament Heritage — golfEQUALIZER",
  description:
    "Explore the rich history of professional golf tournaments. Champions, courses, and the moments that defined the game.",
};

export default function TournamentsPage() {
  return <TournamentsHub />;
}
