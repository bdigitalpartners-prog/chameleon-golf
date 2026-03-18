import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const hideBroken = url.searchParams.get("hideBroken") === "true";

    const where: any = { isApproved: true };
    if (hideBroken) {
      where.linkStatus = { not: "broken" };
    }

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
      }),
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
    ]);

    return NextResponse.json({ content, books });
  } catch (err: any) {
    console.error("Fairway API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
