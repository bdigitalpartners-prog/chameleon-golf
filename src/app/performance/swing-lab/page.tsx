import { Metadata } from "next";
import { CategoryPageLayout } from "../CategoryPageLayout";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "The Swing Lab — Performance Center — golfEQUALIZER",
  description: "Swing fundamentals, common fixes, club-specific tips, and a drills library to build a repeatable, powerful golf swing.",
};

const subcategories = [
  { value: "swing-fundamentals", label: "Swing Fundamentals" },
  { value: "common-fixes", label: "Common Fixes" },
  { value: "by-club", label: "By Club" },
  { value: "drills-library", label: "Drills Library" },
];

const articleListSelect = {
  slug: true, title: true, subtitle: true, category: true,
  subcategory: true, difficulty: true, estimatedTime: true,
  tags: true, featured: true,
} as const;

export default async function SwingLabPage() {
  let articles: any[] = [];

  try {
    const prisma = (await import("@/lib/prisma")).default;
    articles = await prisma.performanceArticle.findMany({
      where: { category: "swing-lab" },
      orderBy: { sortOrder: "asc" },
      select: articleListSelect,
    });
  } catch (e) {
    console.error("[Performance/swing-lab] Failed to load data:", e);
  }

  return (
    <CategoryPageLayout
      title="The Swing Lab"
      description="Training tips, swing analysis, and drills organized by fundamentals, common fixes, club type, and difficulty level."
      iconName="Crosshair"
      articles={articles}
      subcategories={subcategories}
    />
  );
}
