import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const users = await prisma.$queryRaw<Array<{
      ghin_number: string | null;
      handicap_index: number | null;
      ghin_verified: boolean;
    }>>`
      SELECT ghin_number, handicap_index::float as handicap_index, ghin_verified
      FROM users WHERE id = ${userId} LIMIT 1
    `;

    const user = users[0] ?? null;

    if (!user) {
      return NextResponse.json({ verification: null, profile: null });
    }

    const queue = await prisma.$queryRaw<Array<{
      queue_id: number;
      ghin_number: string | null;
      status: string;
      review_notes: string | null;
      submitted_at: Date;
      reviewed_at: Date | null;
    }>>`
      SELECT queue_id, ghin_number, status, review_notes, submitted_at, reviewed_at
      FROM admin_verification_queue
      WHERE user_id = ${userId}
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    const entry = queue[0] ?? null;

    const verification = entry
      ? {
          id: String(entry.queue_id),
          ghinNumber: entry.ghin_number ?? "",
          handicapIndex: user.handicap_index,
          status: entry.status,
          reviewNote: entry.review_notes ?? null,
          createdAt: entry.submitted_at instanceof Date ? entry.submitted_at.toISOString() : String(entry.submitted_at),
          reviewedAt: entry.reviewed_at instanceof Date ? entry.reviewed_at.toISOString() : entry.reviewed_at ? String(entry.reviewed_at) : null,
        }
      : null;

    return NextResponse.json({
      verification,
      profile: {
        handicapIndex: user.handicap_index,
        handicapVerified: user.ghin_verified ?? false,
        ghinNumber: user.ghin_number,
      },
    });
  } catch (err: any) {
    console.error("GHIN status error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}
