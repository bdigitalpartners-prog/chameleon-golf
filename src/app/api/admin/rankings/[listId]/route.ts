import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const listId = parseInt(params.listId, 10);

    const list = await prisma.rankingList.findUnique({
      where: { listId },
      include: {
        source: true,
        entries: {
          include: {
            course: { select: { courseId: true, courseName: true, city: true, state: true } },
          },
          orderBy: { rankPosition: "asc" },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...list,
      listWeight: Number(list.listWeight),
      source: {
        ...list.source,
        authorityWeight: Number(list.source.authorityWeight),
      },
      entries: list.entries.map((e) => ({
        entryId: e.entryId,
        listId: e.listId,
        courseId: e.courseId,
        courseName: e.course.courseName,
        city: e.course.city,
        state: e.course.state,
        rankPosition: e.rankPosition,
        rankTied: e.rankTied,
        score: e.score ? Number(e.score) : null,
        previousRank: e.previousRank,
        rankChange: e.rankChange,
        notes: e.notes,
      })),
    });
  } catch (err) {
    console.error("Ranking list detail error:", err);
    return NextResponse.json({ error: "Failed to fetch ranking list" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const listId = parseInt(params.listId, 10);
    const body = await request.json();
    const { listName, listType, region, yearPublished, cycleLabel, prestigeTier, listWeight } = body;

    const updated = await prisma.rankingList.update({
      where: { listId },
      data: {
        ...(listName !== undefined && { listName }),
        ...(listType !== undefined && { listType }),
        ...(region !== undefined && { region }),
        ...(yearPublished !== undefined && { yearPublished: parseInt(yearPublished, 10) }),
        ...(cycleLabel !== undefined && { cycleLabel }),
        ...(prestigeTier !== undefined && { prestigeTier }),
        ...(listWeight !== undefined && { listWeight: parseFloat(listWeight) }),
      },
    });

    return NextResponse.json({ success: true, list: updated });
  } catch (err) {
    console.error("Ranking list update error:", err);
    return NextResponse.json({ error: "Failed to update ranking list" }, { status: 500 });
  }
}
