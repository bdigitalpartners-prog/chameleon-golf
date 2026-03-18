import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/looper-guild/caddies — list approved caddies, optional courseId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const where: any = { status: "APPROVED" };

    if (courseId) {
      where.courses = { some: { courseId: parseInt(courseId, 10) } };
    }

    const caddies = await prisma.caddy.findMany({
      where,
      include: {
        courses: {
          include: {
            course: { select: { courseId: true, courseName: true } },
          },
        },
        ratings: { select: { rating: true } },
      },
      orderBy: { approvedAt: "desc" },
    });

    const result = caddies.map((c) => ({
      ...c,
      avgRating:
        c.ratings.length > 0
          ? c.ratings.reduce((sum, r) => sum + r.rating, 0) / c.ratings.length
          : null,
      totalRatings: c.ratings.length,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/looper-guild/caddies error:", error);
    return NextResponse.json({ error: "Failed to fetch caddies" }, { status: 500 });
  }
}

// POST /api/looper-guild/caddies — caddy application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, bio, yearsExperience, photoUrl, courseNames } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.caddy.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { error: "An application with this email already exists" },
        { status: 409 }
      );
    }

    const caddy = await prisma.caddy.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        bio: bio?.trim() || null,
        yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : null,
        photoUrl: photoUrl?.trim() || null,
      },
    });

    // Link courses if provided (array of courseId numbers)
    if (Array.isArray(courseNames) && courseNames.length > 0) {
      const courseLinks = courseNames
        .filter((id: any) => typeof id === "number" || (typeof id === "string" && !isNaN(parseInt(id, 10))))
        .map((id: any, i: number) => ({
          caddyId: caddy.id,
          courseId: typeof id === "number" ? id : parseInt(id, 10),
          isPrimary: i === 0,
        }));

      if (courseLinks.length > 0) {
        await prisma.caddyCourse.createMany({ data: courseLinks });
      }
    }

    return NextResponse.json(
      { success: true, message: "Application submitted successfully", id: caddy.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/looper-guild/caddies error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
