import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { fanOutToCircle } from "@/lib/feed";

// GET — List condition reports
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, [
    "OWNER",
    "ADMIN",
    "MEMBER",
  ]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const courseId = searchParams.get("courseId");
  const days = Number(searchParams.get("days") ?? 30);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: any = {
    circleId,
    reportDate: { gte: since },
  };
  if (courseId) where.courseId = Number(courseId);

  const [reports, total] = await Promise.all([
    prisma.conditionReport.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
      },
      orderBy: { reportDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conditionReport.count({ where }),
  ]);

  return NextResponse.json({
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST — Submit condition report
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, [
    "OWNER",
    "ADMIN",
    "MEMBER",
  ]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  // Must be verified member
  if (!auth.membership?.verifiedAt) {
    return NextResponse.json(
      { error: "Only verified members can submit condition reports" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    courseId,
    greensSpeed,
    fairwayFirmness,
    roughHeight,
    bunkerCondition,
    overallCondition,
    weatherImpact,
    notes,
    photos,
  } = body;

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 }
    );
  }

  const report = await prisma.conditionReport.create({
    data: {
      circleId,
      courseId: Number(courseId),
      userId,
      greensSpeed: greensSpeed ? Number(greensSpeed) : null,
      fairwayFirmness: fairwayFirmness ? Number(fairwayFirmness) : null,
      roughHeight: roughHeight ? Number(roughHeight) : null,
      bunkerCondition: bunkerCondition ? Number(bunkerCondition) : null,
      overallCondition: overallCondition ? Number(overallCondition) : null,
      weatherImpact: weatherImpact ?? null,
      notes: notes ?? null,
      photos: photos ?? [],
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      course: { select: { courseId: true, courseName: true } },
    },
  });

  // Fan out to circle feed
  await fanOutToCircle({
    circleId,
    type: "CONDITION_REPORT",
    actorId: userId,
    courseId: Number(courseId),
    metadata: { reportId: report.id, overallCondition },
  });

  return NextResponse.json({ report }, { status: 201 });
}
