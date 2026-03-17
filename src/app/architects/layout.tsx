import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golf Course Architects | golfEQUALIZER",
  description:
    "Explore profiles of legendary golf course architects — from Donald Ross and Alister MacKenzie to modern masters like Tom Fazio, Pete Dye, and Coore & Crenshaw.",
};

export default function ArchitectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
