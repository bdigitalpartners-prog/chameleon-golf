import { Metadata } from "next";
import { CategoryPageLayout } from "../CategoryPageLayout";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Equipment Intelligence — Performance Center — golfEQUALIZER",
  description: "Fitting guides, technology explained, and gear trends — data-driven insights for smarter equipment decisions.",
};

const subcategories = [
  { value: "fitting-guide", label: "Fitting Guide" },
  { value: "technology-explained", label: "Technology Explained" },
  { value: "gear-trends", label: "Gear Trends" },
];

const articleListSelect = {
  slug: true, title: true, subtitle: true, category: true,
  subcategory: true, difficulty: true, estimatedTime: true,
  tags: true, featured: true,
} as const;

export default async function EquipmentIntelPage() {
  let articles: any[] = [];

  try {
    const prisma = (await import("@/lib/prisma")).default;
    articles = await prisma.performanceArticle.findMany({
      where: { category: "equipment-intel" },
      orderBy: { sortOrder: "asc" },
      select: articleListSelect,
    });
  } catch (e) {
    console.error("[Performance/equipment-intel] Failed to load data:", e);
  }

  return (
    <CategoryPageLayout
      title="Equipment Intelligence"
      description="Data-driven equipment insights — fitting guides, technology demystified, and the trends shaping golf gear innovation."
      iconName="Wrench"
      articles={articles}
      subcategories={subcategories}
    />
  );
}
