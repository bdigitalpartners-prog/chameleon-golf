import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["Want to Play", "Planning", "Booked", "Played"];
const VALID_PRIORITIES = ["Low", "Medium", "High", "Must-Play"];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const state = url.searchParams.get("state") || undefined;
    const accessType = url.searchParams.get("accessType") || undefined;
    const sortBy = url.searchParams.get("sortBy") || "addedAt";
    const sortDir = url.searchParams.get("sortDir") || "desc";

    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (state) where.course = { ...where.course, state };
    if (accessType) where.course = { ...where.course, accessType };

    const orderBy: any = {};
    if (sortBy === "addedAt") orderBy.addedAt = sortDir;
    else if (sortBy === "priority") orderBy.priority = sortDir;
    else if (sortBy === "alphabetical") orderBy.course = { courseName: sortDir };
    else orderBy.addedAt = sortDir;

    const items = await prisma.bucketListItem.findMany({
      where,
      orderBy,
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            facilityName: true,
            city: true,
            state: true,
            country: true,
            accessType: true,
            courseStyle: true,
            greenFeeLow: true,
            greenFeeHigh: true,
            latitude: true,
            longitude: true,
            media: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
            chameleonScores: {
              select: { chameleonScore: true },
            },
            rankings: {
              select: {
                rankPosition: true,
                list: { select: { listName: true, source: { select: { sourceName: true } } } },
              },
              orderBy: { rankPosition: "asc" },
              take: 1,
            },
          },
        },
      },
    });

    const serialized = items.map((item) => ({
      id: item.id,
      courseId: item.courseId,
      priority: item.priority,
      notes: item.notes,
      targetDate: item.targetDate?.toISOString() ?? null,
      status: item.status,
      playedAt: item.playedAt?.toISOString() ?? null,
      rating: item.rating ? Number(item.rating) : null,
      addedAt: item.addedAt.toISOString(),
      course: {
        courseId: item.course.courseId,
        courseName: item.course.courseName,
        facilityName: item.course.facilityName,
        city: item.course.city,
        state: item.course.state,
        country: item.course.country,
        accessType: item.course.accessType,
        courseStyle: item.course.courseStyle,
        greenFeeLow: item.course.greenFeeLow ? Number(item.course.greenFeeLow) : null,
        greenFeeHigh: item.course.greenFeeHigh ? Number(item.course.greenFeeHigh) : null,
        latitude: item.course.latitude ? Number(item.course.latitude) : null,
        longitude: item.course.longitude ? Number(item.course.longitude) : null,
        primaryImageUrl: item.course.media[0]?.url ?? null,
        chameleonScore: item.course.chameleonScores
          ? Number(item.course.chameleonScores.chameleonScore)
          : null,
        bestRank: item.course.rankings[0]?.rankPosition ?? null,
        bestSource: item.course.rankings[0]?.list?.source?.sourceName ?? null,
      },
    }));

    return NextResponse.json({ items: serialized });
  } catch (error) {
    console.error("[BucketList GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { courseId, priority, notes, targetDate, status } = body;

    if (!courseId || typeof courseId !== "number") {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await prisma.bucketListItem.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Course already on bucket list" }, { status: 409 });
    }

    const item = await prisma.bucketListItem.create({
      data: {
        userId,
        courseId,
        priority: priority && VALID_PRIORITIES.includes(priority) ? priority : "Medium",
        notes: notes || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: status && VALID_STATUSES.includes(status) ? status : "Want to Play",
      },
    });

    return NextResponse.json({
      id: item.id,
      courseId: item.courseId,
      priority: item.priority,
      status: item.status,
      addedAt: item.addedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("[BucketList POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
