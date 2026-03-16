import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const listId = parseInt(params.listId, 10);
    const body = await request.json();
    const { courseId, rankPosition, score, previousRank, rankChange, notes } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const entry = await prisma.rankingEntry.create({
      data: {
        listId,
        courseId: parseInt(courseId, 10),
        rankPosition: rankPosition ? parseInt(rankPosition, 10) : null,
        score: score ? parseFloat(score) : null,
        previousRank: previousRank ? parseInt(previousRank, 10) : null,
        rankChange: rankChange ? parseInt(rankChange, 10) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "This course is already in this list" }, { status: 409 });
    }
    console.error("Ranking entry create error:", err);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
