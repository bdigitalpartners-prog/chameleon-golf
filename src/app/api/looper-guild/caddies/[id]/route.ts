import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/looper-guild/caddies/[id] — single caddy profile with ratings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caddy = await prisma.caddy.findUnique({
      where: { id: params.id },
      include: {
        courses: {
          include: {
            course: { select: { courseId: true, courseName: true } },
          },
        },
        ratings: {
          include: {
            user: { select: { id: true, name: true, image: true } },
            course: { select: { courseId: true, courseName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!caddy) {
      return NextResponse.json({ error: "Caddy not found" }, { status: 404 });
    }

    const avgRating =
      caddy.ratings.length > 0
        ? caddy.ratings.reduce((sum, r) => sum + r.rating, 0) / caddy.ratings.length
        : null;

    return NextResponse.json({ ...caddy, avgRating, totalRatings: caddy.ratings.length });
  } catch (error: any) {
    console.error("GET /api/looper-guild/caddies/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch caddy" }, { status: 500 });
  }
}
