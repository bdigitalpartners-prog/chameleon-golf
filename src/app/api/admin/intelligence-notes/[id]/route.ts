import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/intelligence-notes/:id
 *
 * Update a single intelligence note.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();
    const { title, content, icon, isVisible } = body;

    const update: any = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (icon !== undefined) update.icon = icon;
    if (isVisible !== undefined) update.isVisible = isVisible;

    const note = await prisma.courseIntelligenceNote.update({
      where: { id },
      data: update,
    });

    return NextResponse.json({ note });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/intelligence-notes/:id
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const id = parseInt(params.id, 10);
    await prisma.courseIntelligenceNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
