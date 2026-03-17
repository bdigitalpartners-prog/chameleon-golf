import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status"); // pending, approved, all
    const contentType = url.searchParams.get("contentType");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");

    const where: any = {};
    if (status === "pending") where.isApproved = false;
    else if (status === "approved") where.isApproved = true;
    if (contentType) where.contentType = contentType;

    const [items, total] = await Promise.all([
      prisma.externalContent.findMany({
        where,
        include: {
          architects: { include: { architect: { select: { id: true, name: true } } } },
          courses: { include: { course: { select: { courseId: true, courseName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.externalContent.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Admin content list error:", err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { architectIds, courseIds, ...data } = body;

    const content = await prisma.externalContent.create({
      data: {
        ...data,
        isApproved: true,
        architects: architectIds?.length
          ? { create: architectIds.map((id: number) => ({ architectId: id, relevance: "primary" })) }
          : undefined,
        courses: courseIds?.length
          ? { create: courseIds.map((id: number) => ({ courseId: id, relevance: "primary" })) }
          : undefined,
      },
      include: {
        architects: { include: { architect: { select: { id: true, name: true } } } },
        courses: { include: { course: { select: { courseId: true, courseName: true } } } },
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (err) {
    console.error("Admin content create error:", err);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, architectIds, courseIds, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Update content and replace links if provided
    const content = await prisma.externalContent.update({
      where: { id },
      data,
    });

    if (architectIds !== undefined) {
      await prisma.contentArchitectLink.deleteMany({ where: { contentId: id } });
      if (architectIds.length > 0) {
        await prisma.contentArchitectLink.createMany({
          data: architectIds.map((aId: number) => ({ contentId: id, architectId: aId, relevance: "primary" })),
        });
      }
    }

    if (courseIds !== undefined) {
      await prisma.contentCourseLink.deleteMany({ where: { contentId: id } });
      if (courseIds.length > 0) {
        await prisma.contentCourseLink.createMany({
          data: courseIds.map((cId: number) => ({ contentId: id, courseId: cId, relevance: "primary" })),
        });
      }
    }

    const updated = await prisma.externalContent.findUnique({
      where: { id },
      include: {
        architects: { include: { architect: { select: { id: true, name: true } } } },
        courses: { include: { course: { select: { courseId: true, courseName: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Admin content update error:", err);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id query param required" }, { status: 400 });
    }

    await prisma.externalContent.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin content delete error:", err);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
