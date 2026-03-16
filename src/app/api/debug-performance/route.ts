import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, any> = {};

  // Test 1: Can we import prisma?
  try {
    const prisma = (await import("@/lib/prisma")).default;
    results.prismaImport = "OK";

    // Test 2: Can we run a basic query?
    try {
      const count = await prisma.course.count();
      results.courseCount = count;
    } catch (e: any) {
      results.courseCountError = e.message;
    }

    // Test 3: Can we query performanceArticle?
    try {
      const articles = await prisma.performanceArticle.findMany({ take: 1 });
      results.performanceArticleQuery = `OK - ${articles.length} results`;
    } catch (e: any) {
      results.performanceArticleError = e.message;
    }

    // Test 4: Can we query architect?
    try {
      const architects = await prisma.architect.findMany({ take: 1 });
      results.architectQuery = `OK - ${architects.length} results`;
    } catch (e: any) {
      results.architectError = e.message;
    }
  } catch (e: any) {
    results.prismaImportError = e.message;
  }

  // Test 5: Can we import the components?
  try {
    await import("@/components/performance/PerformanceHero");
    results.heroImport = "OK";
  } catch (e: any) {
    results.heroImportError = e.message;
  }

  try {
    await import("@/components/performance/PerformanceCategoryCard");
    results.categoryCardImport = "OK";
  } catch (e: any) {
    results.categoryCardImportError = e.message;
  }

  return NextResponse.json(results, { status: 200 });
}
