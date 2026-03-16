import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const VALID_CONTENT_TYPES = ["POST", "COMMENT", "THREAD", "REPLY"];
const VALID_REASONS = ["SPAM", "INAPPROPRIATE", "HARASSMENT", "OTHER"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await request.json();
    const { contentType, contentId, reason, details } = body;

    if (!contentType || !VALID_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }
    if (!contentId) {
      return NextResponse.json({ error: "Content ID required" }, { status: 400 });
    }
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    // Check for duplicate report
    const existing = await prisma.contentReport.findFirst({
      where: { reporterId: userId, contentType, contentId },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already reported this content" }, { status: 409 });
    }

    const report = await prisma.contentReport.create({
      data: {
        reporterId: userId,
        contentType,
        contentId,
        reason,
        details: details || null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
