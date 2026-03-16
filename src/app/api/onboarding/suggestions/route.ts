import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Get popular circles
    const circles = await prisma.circle.findMany({
      where: {
        privacy: { not: "SECRET" },
        members: { none: { userId } },
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { members: { _count: "desc" } },
      take: 6,
    });

    // Get trending courses (most rated recently)
    const courses = await prisma.course.findMany({
      where: {
        ratings: { some: {} },
      },
      include: {
        _count: { select: { ratings: true } },
      },
      orderBy: { ratings: { _count: "desc" } },
      take: 10,
    });

    // Get suggested users (active users not connected)
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const connectedIds = new Set(
      connections.map((c) => (c.senderId === userId ? c.receiverId : c.senderId))
    );
    connectedIds.add(userId);

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(connectedIds) },
        name: { not: null },
      },
      select: {
        id: true,
        name: true,
        image: true,
        handicapIndex: true,
      },
      take: 10,
    });

    return NextResponse.json({
      circles: circles.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: c.type,
        privacy: c.privacy,
        avatarUrl: c.avatarUrl,
        description: c.description,
        memberCount: c._count.members,
      })),
      courses: courses.map((c) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        city: c.city,
        state: c.state,
        country: c.country,
        logoUrl: c.logoUrl,
        ratingCount: c._count.ratings,
      })),
      users,
    });
  } catch (error) {
    console.error("Failed to fetch onboarding suggestions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
