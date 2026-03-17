import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slugify";
import { CIRCLE_DEFAULTS } from "@/lib/circle-defaults";
import { CircleType, CirclePrivacy } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, type, privacy, description, maxMembers, verificationMethod, verificationDomain, config } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "name and type are required" }, { status: 400 });
    }

    // Validate name
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (trimmedName.length === 0) {
      return NextResponse.json({ error: "Circle name cannot be empty or whitespace-only" }, { status: 400 });
    }
    if (trimmedName.length > 255) {
      return NextResponse.json({ error: "Circle name must be 255 characters or fewer" }, { status: 400 });
    }

    // Validate description
    if (description !== undefined && description !== null && typeof description === "string" && description.length > 2000) {
      return NextResponse.json({ error: "Description must be 2000 characters or fewer" }, { status: 400 });
    }

    // Validate maxMembers
    if (maxMembers !== undefined && maxMembers !== null) {
      const maxMembersNum = Number(maxMembers);
      if (!Number.isInteger(maxMembersNum) || maxMembersNum < 1) {
        return NextResponse.json({ error: "maxMembers must be an integer >= 1" }, { status: 400 });
      }
    }

    if (!Object.keys(CIRCLE_DEFAULTS).includes(type)) {
      return NextResponse.json({ error: "Invalid circle type" }, { status: 400 });
    }

    const defaults = CIRCLE_DEFAULTS[type as CircleType];
    const slug = await uniqueSlug(trimmedName);

    const circle = await prisma.circle.create({
      data: {
        name: trimmedName,
        slug,
        description: description ?? null,
        type: type as CircleType,
        privacy: (privacy as CirclePrivacy) ?? defaults.privacy,
        maxMembers: maxMembers ?? defaults.maxMembers,
        verificationMethod: verificationMethod ?? defaults.verificationMethod ?? null,
        verificationDomain: verificationDomain ?? null,
        config: config ?? { allowMemberInvites: defaults.allowMemberInvites },
        memberCount: 1,
        createdById: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: { take: 5, include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });

    return NextResponse.json(circle, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");

    const where: any = {
      members: {
        some: {
          userId,
          role: { not: "PENDING" },
        },
      },
    };

    if (typeFilter) {
      where.type = typeFilter;
    }

    const circles = await prisma.circle.findMany({
      where,
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = circles.map((c) => ({
      ...c,
      userRole: c.members[0]?.role ?? null,
      members: undefined,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/circles error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
