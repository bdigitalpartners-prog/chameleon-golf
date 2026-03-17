import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const search = url.searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          architects: { include: { architect: { select: { id: true, name: true } } } },
          courses: { include: { course: { select: { courseId: true, courseName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.book.count({ where }),
    ]);

    return NextResponse.json({ books, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Admin books list error:", err);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { architectIds, courseIds, ...data } = body;

    if (!data.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        ...data,
        architects: architectIds?.length
          ? { create: architectIds.map((id: number) => ({ architectId: id })) }
          : undefined,
        courses: courseIds?.length
          ? { create: courseIds.map((id: number) => ({ courseId: id })) }
          : undefined,
      },
      include: {
        architects: { include: { architect: { select: { id: true, name: true } } } },
        courses: { include: { course: { select: { courseId: true, courseName: true } } } },
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    console.error("Book create error:", err);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
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

    const book = await prisma.book.update({
      where: { id },
      data,
    });

    if (architectIds !== undefined) {
      await prisma.bookArchitectLink.deleteMany({ where: { bookId: id } });
      if (architectIds.length > 0) {
        await prisma.bookArchitectLink.createMany({
          data: architectIds.map((aId: number) => ({ bookId: id, architectId: aId })),
        });
      }
    }

    if (courseIds !== undefined) {
      await prisma.bookCourseLink.deleteMany({ where: { bookId: id } });
      if (courseIds.length > 0) {
        await prisma.bookCourseLink.createMany({
          data: courseIds.map((cId: number) => ({ bookId: id, courseId: cId })),
        });
      }
    }

    const updated = await prisma.book.findUnique({
      where: { id },
      include: {
        architects: { include: { architect: { select: { id: true, name: true } } } },
        courses: { include: { course: { select: { courseId: true, courseName: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Book update error:", err);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
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

    await prisma.book.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Book delete error:", err);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
