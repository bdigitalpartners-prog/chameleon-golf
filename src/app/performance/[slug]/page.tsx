import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/performance/ArticlePage";

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const article = await prisma.performanceArticle.findUnique({
      where: { slug: params.slug },
    });

    if (!article) return { title: "Not Found — golfEQUALIZER" };

    return {
      title: `${article.title} — Performance Center — golfEQUALIZER`,
      description: article.subtitle || article.title,
    };
  } catch (e) {
    console.error("[Performance/slug] generateMetadata failed:", e);
    return { title: "Performance Center — golfEQUALIZER" };
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const article = await prisma.performanceArticle.findUnique({
      where: { slug: params.slug },
    });

    if (!article) notFound();

    const relatedArticles = await prisma.performanceArticle.findMany({
      where: {
        category: article.category,
        slug: { not: article.slug },
      },
      orderBy: { sortOrder: "asc" },
      take: 3,
    });

    return <ArticlePage article={article} relatedArticles={relatedArticles} />;
  } catch (e) {
    console.error("[Performance/slug] Failed to load article:", e);
    notFound();
  }
}
