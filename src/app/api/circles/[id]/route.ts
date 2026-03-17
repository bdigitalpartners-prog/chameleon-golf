import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { id } = params;

    const circle = await prisma.circle.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        members: {
          take: 5,
          where: { role: { not: "PENDING" } },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
      },
    });

    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    let userRole = null;
    if (userId) {
      const membership = await prisma.circleMembership.findUnique({
        where: { circleId_userId: { circleId: id, userId } },
      });
      userRole = membership?.role ?? null;
    }

    if (circle.privacy === "SECRET" && !userRole) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const isMember = userRole && userRole !== "PENDING";

    // For PRIVATE circles, non-members only see basic info (no member preview)
    if (circle.privacy === "PRIVATE" && !isMember) {
      const { members, config, ...basicInfo } = circle;
      return NextResponse.json({
        ...basicInfo,
        userRole,
      });
    }

    return NextResponse.json({
      ...circle,
      config: isMember ? circle.config : undefined,
      userRole,
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;

    const auth = await withCircleAuth(id, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const allowedFields = ["name", "description", "privacy", "imageUrl", "maxMembers", "config", "verificationMethod", "verificationDomain"];
    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const circle = await prisma.circle.update({
      where: { id },
      data,
    });

    return NextResponse.json(circle);
  } catch (error: any) {
    console.error("PATCH /api/circles/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;

    const auth = await withCircleAuth(id, userId, ["OWNER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await prisma.circle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/circles/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
