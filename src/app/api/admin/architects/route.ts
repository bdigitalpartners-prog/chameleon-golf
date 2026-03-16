import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { era: { contains: search, mode: "insensitive" } },
        { nationality: { contains: search, mode: "insensitive" } },
      ];
    }

    const [architects, totalCount] = await Promise.all([
      prisma.architect.findMany({
        where,
        include: {
          _count: { select: { courses: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.architect.count({ where }),
    ]);

    return NextResponse.json({
      architects,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Architects API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch architects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, slug, bornYear, diedYear, nationality, bio, designPhilosophy, signatureCourses, notableFeatures, era, totalCoursesDesigned, imageUrl } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    const architect = await prisma.architect.upsert({
      where: { slug },
      update: {
        name,
        bornYear: bornYear || null,
        diedYear: diedYear || null,
        nationality: nationality || null,
        bio: bio || null,
        designPhilosophy: designPhilosophy || null,
        signatureCourses: signatureCourses || [],
        notableFeatures: notableFeatures || [],
        era: era || null,
        totalCoursesDesigned: totalCoursesDesigned || null,
        imageUrl: imageUrl || null,
      },
      create: {
        name,
        slug,
        bornYear: bornYear || null,
        diedYear: diedYear || null,
        nationality: nationality || null,
        bio: bio || null,
        designPhilosophy: designPhilosophy || null,
        signatureCourses: signatureCourses || [],
        notableFeatures: notableFeatures || [],
        era: era || null,
        totalCoursesDesigned: totalCoursesDesigned || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(architect, { status: 201 });
  } catch (err) {
    console.error("Architect create error:", err);
    return NextResponse.json(
      { error: "Failed to create architect" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const architect = await prisma.architect.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(architect);
  } catch (err) {
    console.error("Architect update error:", err);
    return NextResponse.json(
      { error: "Failed to update architect" },
      { status: 500 }
    );
  }
}
