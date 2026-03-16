import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { PerformanceHero } from "@/components/performance/PerformanceHero";
import { PerformanceCategoryCard } from "@/components/performance/PerformanceCategoryCard";
import { ArticleCard } from "@/components/performance/ArticleCard";
import {
  Crosshair,
  Dumbbell,
  Brain,
  Wrench,
  BarChart3,
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "The Performance Center — golfEQUALIZER",
  description:
    "Elevate your game with data-driven training guides, swing analysis, fitness routines, mental game strategies, and equipment intelligence.",
};

const categories = [
  {
    key: "swing-lab",
    href: "/performance/swing-lab",
    title: "The Swing Lab",
    description: "Swing fundamentals, common fixes, club-specific tips, and a drills library to build a repeatable, powerful golf swing.",
    icon: Crosshair,
  },
  {
    key: "fitness",
    href: "/performance/fitness",
    title: "Golf Fitness",
    description: "Mobility routines, strength training, injury prevention, and on-course nutrition to optimize your physical game.",
    icon: Dumbbell,
  },
  {
    key: "mental-game",
    href: "/performance/mental-game",
    title: "The Mental Game",
    description: "Pre-round routines, course management, pressure performance, and deliberate practice strategies.",
    icon: Brain,
  },
  {
    key: "equipment-intel",
    href: "/performance/equipment-intel",
    title: "Equipment Intelligence",
    description: "Fitting guides, technology explained, and gear trends — data-driven insights for smarter equipment decisions.",
    icon: Wrench,
  },
  {
    key: "stats-center",
    href: "/performance/stats-center",
    title: "The Stats Center",
    description: "Key stats to track, strokes gained explained, handicap intelligence, and practice metrics that drive improvement.",
    icon: BarChart3,
  },
];

export default async function PerformancePage() {
  let countMap: Record<string, number> = {};
  let featuredArticles: Awaited<ReturnType<typeof prisma.performanceArticle.findMany>> = [];

  try {
    const [articleCounts, featured] = await Promise.all([
      prisma.performanceArticle.groupBy({
        by: ["category"],
        _count: { id: true },
      }),
      prisma.performanceArticle.findMany({
        where: { featured: true },
        orderBy: { sortOrder: "asc" },
        take: 6,
      }),
    ]);

    articleCounts.forEach((g) => {
      countMap[g.category] = g._count.id;
    });
    featuredArticles = featured;
  } catch {
    // Table may not exist yet — render with empty data
  }

  return (
    <div style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <PerformanceHero />

      {/* Category grid */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: "var(--cg-bg-secondary)" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Training Sections
            </h2>
            <p
              className="mt-4 mx-auto max-w-2xl text-base"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Five focused areas covering every dimension of golf performance — from the physical to the mental, the technical to the analytical.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <PerformanceCategoryCard
                key={cat.key}
                href={cat.href}
                title={cat.title}
                description={cat.description}
                icon={cat.icon}
                articleCount={countMap[cat.key] || 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured content */}
      {featuredArticles.length > 0 && (
        <section
          className="py-16 sm:py-20"
          style={{
            backgroundColor: "var(--cg-bg-primary)",
            borderTop: "1px solid var(--cg-border-subtle)",
          }}
        >
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2
                className="text-2xl font-bold sm:text-3xl"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Featured Guides
              </h2>
              <p
                className="mt-4 mx-auto max-w-2xl text-base"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Hand-picked training content to accelerate your improvement.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <ArticleCard
                  key={article.slug}
                  slug={article.slug}
                  title={article.title}
                  subtitle={article.subtitle}
                  category={article.category}
                  subcategory={article.subcategory}
                  difficulty={article.difficulty}
                  estimatedTime={article.estimatedTime}
                  tags={article.tags}
                  featured={article.featured}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
