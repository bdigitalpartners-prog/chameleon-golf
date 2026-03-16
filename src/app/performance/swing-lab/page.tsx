import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Crosshair } from "lucide-react";
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

export default async function SwingLabPage() {
  const articles = await prisma.performanceArticle.findMany({
    where: { category: "swing-lab" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <CategoryPageLayout
      title="The Swing Lab"
      description="Training tips, swing analysis, and drills organized by fundamentals, common fixes, club type, and difficulty level."
      icon={Crosshair}
      articles={articles}
      subcategories={subcategories}
    />
  );
}
