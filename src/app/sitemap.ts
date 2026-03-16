import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 86400; // revalidate daily

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://golfequalizer.ai";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/rankings`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    // Get all courses for individual pages
    const courses = await prisma.course.findMany({
      select: { courseId: true, updatedAt: true },
      orderBy: { courseId: "asc" },
    });

    const coursePages: MetadataRoute.Sitemap = courses.map((c) => ({
      url: `${baseUrl}/course/${c.courseId}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    // Get all ranking list IDs
    const rankings = await prisma.$queryRaw<{ list_id: string }[]>`
      SELECT DISTINCT list_id FROM course_rankings ORDER BY list_id
    `;

    const rankingPages: MetadataRoute.Sitemap = rankings.map((r) => ({
      url: `${baseUrl}/rankings/${encodeURIComponent(r.list_id)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...rankingPages, ...coursePages];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticPages;
  }
}
