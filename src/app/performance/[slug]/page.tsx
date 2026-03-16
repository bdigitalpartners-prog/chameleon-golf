import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/performance/ArticlePage";

export const dynamic = 'force-dynamic';

const articleDetailSelect = {
  slug: true, title: true, subtitle: true, category: true,
  subcategory: true, difficulty: true, estimatedTime: true,
  content: true, tags: true, videoUrl: true, publishedAt: true,
  featured: true,
} as const;

const articleListSelect = {
  slug: true, title: true, subtitle: true, category: true,
  subcategory: true, difficulty: true, estimatedTime: true,
  tags: true, featured: true,
} as const;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const article = await prisma.performanceArticle.findUnique({
      where: { slug: params.slug },
      select: { title: true, subtitle: true },
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
      select: articleDetailSelect,
    });

    if (!article) notFound();

    const relatedArticles = await prisma.performanceArticle.findMany({
      where: {
        category: article.category,
        slug: { not: article.slug },
      },
      orderBy: { sortOrder: "asc" },
      take: 3,
      select: articleListSelect,
    });

    return (
      <ArticlePage
        article={{ ...article, publishedAt: article.publishedAt.toISOString() }}
        relatedArticles={relatedArticles}
      />
    );
  } catch (e) {
    console.error("[Performance/slug] Failed to load article:", e);
    notFound();
  }
}
