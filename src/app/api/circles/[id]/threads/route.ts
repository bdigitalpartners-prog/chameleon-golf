import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

// POST /api/circles/[id]/threads - Create a new discussion thread
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { title, category, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const thread = await prisma.discussionThread.create({
      data: {
        circleId,
        authorId: userId,
        title,
        category: category || "GENERAL",
        replyCount: 1,
        lastReplyAt: new Date(),
        replies: {
          create: {
            authorId: userId,
            content,
          },
        },
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/threads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/circles/[id]/threads - List discussion threads
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    const where: any = { circleId };
    if (category) {
      where.category = category;
    }

    const [threads, total] = await Promise.all([
      prisma.discussionThread.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }],
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      prisma.discussionThread.count({ where }),
    ]);

    return NextResponse.json({
      threads,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/threads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
