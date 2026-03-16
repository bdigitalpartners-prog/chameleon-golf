import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Wrench } from "lucide-react";
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

export default async function EquipmentIntelPage() {
  const articles = await prisma.performanceArticle.findMany({
    where: { category: "equipment-intel" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <CategoryPageLayout
      title="Equipment Intelligence"
      description="Data-driven equipment insights — fitting guides, technology demystified, and the trends shaping golf gear innovation."
      icon={Wrench}
      articles={articles}
      subcategories={subcategories}
    />
  );
}
