import { Metadata } from "next";
import { StatsPageClient } from "./StatsPageClient";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "The Stats Center — Performance Center — golfEQUALIZER",
  description: "Key stats to track, strokes gained explained, handicap intelligence, and practice metrics that drive improvement.",
};

export default async function StatsCenterPage() {
  let articles: any[] = [];

  try {
    const prisma = (await import("@/lib/prisma")).default;
    articles = await prisma.performanceArticle.findMany({
      where: { category: "stats-center" },
      orderBy: { sortOrder: "asc" },
    });
  } catch (e) {
    console.error("[Performance/stats-center] Failed to load data:", e);
  }

  return <StatsPageClient articles={articles} />;
}
