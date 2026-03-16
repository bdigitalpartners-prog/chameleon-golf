import { Metadata } from "next";
import { CategoryPageLayout } from "../CategoryPageLayout";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Golf Fitness — Performance Center — golfEQUALIZER",
  description: "Mobility routines, strength training, injury prevention, and on-course nutrition to optimize your physical game.",
};

const subcategories = [
  { value: "flexibility", label: "Flexibility & Mobility" },
  { value: "strength", label: "Strength Training" },
  { value: "injury-prevention", label: "Injury Prevention" },
  { value: "nutrition", label: "On-Course Nutrition" },
];

export default async function FitnessPage() {
  let articles: any[] = [];

  try {
    const prisma = (await import("@/lib/prisma")).default;
    articles = await prisma.performanceArticle.findMany({
      where: { category: "fitness" },
      orderBy: { sortOrder: "asc" },
    });
  } catch (e) {
    console.error("[Performance/fitness] Failed to load data:", e);
  }

  return (
    <CategoryPageLayout
      title="Golf Fitness"
      description="Physical conditioning for golf performance — flexibility, strength, injury prevention, and nutrition strategies."
      iconName="Dumbbell"
      articles={articles}
      subcategories={subcategories}
    />
  );
}
