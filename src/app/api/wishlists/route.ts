import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { fanOutToCircle } from "@/lib/feed";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    const { courseId, circleId, notes, priority } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { courseId: Number(courseId) },
      select: { courseId: true, courseName: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // If circleId provided, verify membership
    if (circleId) {
      const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
    }

    const wishlist = await prisma.wishlist.upsert({
      where: {
        userId_courseId_circleId: {
          userId,
          courseId: Number(courseId),
          circleId: circleId ?? null,
        },
      },
      create: {
        userId,
        courseId: Number(courseId),
        circleId: circleId ?? null,
        notes: notes ?? null,
        priority: priority ?? 0,
      },
      update: {
        notes: notes ?? null,
        priority: priority ?? 0,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
      },
    });

    // If shared with circle, fan out to feed
    if (circleId) {
      const circle = await prisma.circle.findUnique({
        where: { id: circleId },
        select: { name: true },
      });

      const post = await prisma.post.create({
        data: {
          authorId: userId,
          circleId,
          courseId: Number(courseId),
          type: "WISHLIST_ADD",
          content: `added ${course.courseName} to ${circle?.name ?? "circle"} wishlist`,
        },
      });

      await fanOutToCircle({
        circleId,
        type: "WISHLIST_ADD",
        actorId: userId,
        postId: post.id,
        courseId: Number(courseId),
        metadata: { courseName: course.courseName },
      });
    }

    return NextResponse.json(wishlist, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/wishlists error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const circleId = searchParams.get("circleId");
    const personal = searchParams.get("personal");

    const where: any = { userId };
    if (circleId) {
      where.circleId = circleId;
    } else if (personal === "true") {
      where.circleId = null;
    }

    const wishlists = await prisma.wishlist.findMany({
      where,
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            city: true,
            state: true,
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
        circle: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ wishlists });
  } catch (error: any) {
    console.error("GET /api/wishlists error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
