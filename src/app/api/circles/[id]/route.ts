import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withCircleAuth } from "@/lib/circle-auth";
import { CirclePrivacy } from "@prisma/client";

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    // Validate name
    if (body.name !== undefined) {
      const trimmedName = typeof body.name === "string" ? body.name.trim() : "";
      if (trimmedName.length === 0) {
        return NextResponse.json({ error: "Circle name cannot be empty or whitespace-only" }, { status: 400 });
      }
      if (trimmedName.length > 255) {
        return NextResponse.json({ error: "Circle name must be 255 characters or fewer" }, { status: 400 });
      }
      body.name = trimmedName;
    }

    // Validate description
    if (body.description !== undefined && body.description !== null && typeof body.description === "string" && body.description.length > 2000) {
      return NextResponse.json({ error: "Description must be 2000 characters or fewer" }, { status: 400 });
    }

    // Validate privacy
    if (body.privacy !== undefined) {
      const validPrivacy = Object.values(CirclePrivacy);
      if (!validPrivacy.includes(body.privacy)) {
        return NextResponse.json({ error: `Invalid privacy value. Must be one of: ${validPrivacy.join(", ")}` }, { status: 400 });
      }
    }

    // Validate maxMembers
    if (body.maxMembers !== undefined && body.maxMembers !== null) {
      const maxMembersNum = Number(body.maxMembers);
      if (!Number.isInteger(maxMembersNum) || maxMembersNum < 1) {
        return NextResponse.json({ error: "maxMembers must be an integer >= 1" }, { status: 400 });
      }
      // Can't set lower than current member count
      const currentCircle = await prisma.circle.findUnique({ where: { id }, select: { memberCount: true } });
      if (currentCircle && maxMembersNum < currentCircle.memberCount) {
        return NextResponse.json(
          { error: `maxMembers cannot be less than current member count (${currentCircle.memberCount})` },
          { status: 400 }
        );
      }
    }

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
