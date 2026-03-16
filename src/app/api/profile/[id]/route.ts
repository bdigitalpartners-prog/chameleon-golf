import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        profile: {
          include: {
            tags: { include: { tag: true } },
          },
        },
        _count: {
          select: {
            connectionsSent: { where: { status: "ACCEPTED" } },
            connectionsReceived: { where: { status: "ACCEPTED" } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const connectionsCount =
      user._count.connectionsSent + user._count.connectionsReceived;

    // Check connection status with current user
    let connectionStatus: string | null = null;
    const session = await getServerSession(authOptions);
    if (session && (session.user as any).id !== params.id) {
      const currentUserId = (session.user as any).id;
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: params.id },
            { senderId: params.id, receiverId: currentUserId },
          ],
        },
      });
      connectionStatus = connection?.status ?? null;
    }

    return NextResponse.json({
      ...user,
      connectionsCount,
      connectionStatus,
    });
  } catch (error: any) {
    console.error("GET /api/profile/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    if (currentUserId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { bio, handicap, homeClub, location, avatarUrl, coverUrl, isAvailableToPlay } = body;

    const profile = await prisma.userProfile.upsert({
      where: { userId: params.id },
      update: {
        ...(bio !== undefined && { bio }),
        ...(handicap !== undefined && { handicap: handicap !== null ? parseFloat(handicap) : null }),
        ...(homeClub !== undefined && { homeClub }),
        ...(location !== undefined && { location }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(isAvailableToPlay !== undefined && { isAvailableToPlay }),
      },
      create: {
        userId: params.id,
        bio: bio ?? null,
        handicap: handicap !== undefined && handicap !== null ? parseFloat(handicap) : null,
        homeClub: homeClub ?? null,
        location: location ?? null,
        avatarUrl: avatarUrl ?? null,
        coverUrl: coverUrl ?? null,
        isAvailableToPlay: isAvailableToPlay ?? false,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("PATCH /api/profile/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
