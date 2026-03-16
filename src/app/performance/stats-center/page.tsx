import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { BarChart3 } from "lucide-react";
import { StatsPageClient } from "./StatsPageClient";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "The Stats Center — Performance Center — golfEQUALIZER",
  description: "Key stats to track, strokes gained explained, handicap intelligence, and practice metrics that drive improvement.",
};

export default async function StatsCenterPage() {
  const articles = await prisma.performanceArticle.findMany({
    where: { category: "stats-center" },
    orderBy: { sortOrder: "asc" },
  });

  return <StatsPageClient articles={articles} />;
}
