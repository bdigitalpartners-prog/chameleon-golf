import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/looper-guild/requests — user's own requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const requests = await prisma.caddyRequest.findMany({
      where: { userId },
      include: {
        course: { select: { courseId: true, courseName: true } },
        caddies: {
          include: {
            caddy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("GET /api/looper-guild/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// POST /api/looper-guild/requests — submit a caddy request (auth required)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { courseId, playDate, groupSize, notes, caddyIds } = body;

    if (!courseId) {
      return NextResponse.json({ error: "Course is required" }, { status: 400 });
    }

    const caddyRequest = await prisma.caddyRequest.create({
      data: {
        userId,
        courseId: parseInt(courseId, 10),
        playDate: playDate ? new Date(playDate) : null,
        groupSize: groupSize ? parseInt(groupSize, 10) : null,
        notes: notes?.trim() || null,
        caddies: {
          create: Array.isArray(caddyIds)
            ? caddyIds.map((caddyId: string) => ({ caddyId }))
            : [],
        },
      },
    });

    return NextResponse.json(
      { success: true, message: "Caddy request submitted", id: caddyRequest.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/looper-guild/requests error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
