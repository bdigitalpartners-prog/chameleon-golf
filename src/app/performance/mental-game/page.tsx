import { Metadata } from "next";
import { Brain } from "lucide-react";
import { CategoryPageLayout } from "../CategoryPageLayout";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "The Mental Game — Performance Center — golfEQUALIZER",
  description: "Pre-round routines, course management, pressure performance, and deliberate practice strategies.",
};

const subcategories = [
  { value: "pre-round", label: "Pre-Round Routines" },
  { value: "course-management", label: "Course Management" },
  { value: "pressure", label: "Pressure Performance" },
  { value: "practice-with-purpose", label: "Practice with Purpose" },
];

export default async function MentalGamePage() {
  let articles: any[] = [];

  try {
    const prisma = (await import("@/lib/prisma")).default;
    articles = await prisma.performanceArticle.findMany({
      where: { category: "mental-game" },
      orderBy: { sortOrder: "asc" },
    });
  } catch (e) {
    console.error("[Performance/mental-game] Failed to load data:", e);
  }

  return (
    <CategoryPageLayout
      title="The Mental Game"
      description="Psychology and course management — visualization, smart targeting, pressure handling, and structured practice planning."
      icon={Brain}
      articles={articles}
      subcategories={subcategories}
    />
  );
}
