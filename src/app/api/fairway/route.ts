import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const hideBroken = url.searchParams.get("hideBroken") === "true";
    const limitParam = url.searchParams.get("limit");
    const featured = url.searchParams.get("featured");

    const where: any = { isApproved: true };
    if (hideBroken) {
      where.linkStatus = { not: "broken" };
    }
    if (featured === "true") {
      where.isFeatured = true;
    }

    const take = limitParam ? parseInt(limitParam) : undefined;

    const [content, books] = await Promise.all([
      prisma.externalContent.findMany({
        where,
        include: {
          architects: {
            include: {
              architect: { select: { id: true, name: true, slug: true } },
            },
          },
          courses: {
            include: {
              course: { select: { courseId: true, courseName: true } },
            },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        ...(take ? { take } : {}),
      }),
      // Skip books when limit is set (used for homepage widget)
      ...(take
        ? []
        : [
            prisma.book.findMany({
              include: {
                architects: {
                  include: {
                    architect: { select: { id: true, name: true, slug: true } },
                  },
                },
              },
              orderBy: { yearPublished: "desc" },
            }),
          ]),
    ]);

    return NextResponse.json({ content, books: take ? [] : (books ?? []) });
  } catch (err: any) {
    console.error("Fairway API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
