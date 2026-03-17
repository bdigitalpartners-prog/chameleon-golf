import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const submissions = await prisma.foundingAdvisoryFeedback.findMany({
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ submissions });
  } catch (err) {
    console.error("Admin feedback API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feedback submissions" },
      { status: 500 }
    );
  }
}
