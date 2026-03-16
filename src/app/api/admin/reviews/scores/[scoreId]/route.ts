import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { scoreId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const scoreId = parseInt(params.scoreId, 10);
    const body = await request.json();
    const { action } = body; // "verify" | "reject"

    await prisma.postedScore.update({
      where: { scoreId },
      data: {
        verificationStatus: action === "verify" ? "verified" : "rejected",
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Score verification error:", err);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
