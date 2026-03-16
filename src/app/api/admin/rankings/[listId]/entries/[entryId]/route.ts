import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { listId: string; entryId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const entryId = parseInt(params.entryId, 10);
    const body = await request.json();
    const { rankPosition, score, previousRank, rankChange, notes } = body;

    const updated = await prisma.rankingEntry.update({
      where: { entryId },
      data: {
        ...(rankPosition !== undefined && { rankPosition: rankPosition ? parseInt(rankPosition, 10) : null }),
        ...(score !== undefined && { score: score ? parseFloat(score) : null }),
        ...(previousRank !== undefined && { previousRank: previousRank ? parseInt(previousRank, 10) : null }),
        ...(rankChange !== undefined && { rankChange: rankChange ? parseInt(rankChange, 10) : null }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (err) {
    console.error("Entry update error:", err);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string; entryId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const entryId = parseInt(params.entryId, 10);
    await prisma.rankingEntry.delete({ where: { entryId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Entry delete error:", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
