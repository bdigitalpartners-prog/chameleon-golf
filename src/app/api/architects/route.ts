import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const architect = await prisma.architect.findUnique({
        where: { slug },
        include: {
          courses: {
            select: {
              courseId: true,
              courseName: true,
              city: true,
              state: true,
              country: true,
              yearOpened: true,
              media: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
            orderBy: { courseName: "asc" },
          },
        },
      });

      if (!architect) {
        return NextResponse.json({ error: "Architect not found" }, { status: 404 });
      }

      return NextResponse.json(architect);
    }

    // List all architects
    const architects = await prisma.architect.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ architects });
  } catch (err) {
    console.error("Public architects API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch architects" },
      { status: 500 }
    );
  }
}
