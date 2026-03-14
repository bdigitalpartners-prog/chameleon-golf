import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scoreId, action } = await req.json();

  if (action === "approve") {
    await prisma.postedScore.update({
      where: { scoreId: parseInt(scoreId) },
      data: { ghinVerified: true, verifiedAt: new Date() },
    });
    return NextResponse.json({ message: "Score verified" });
  }

  if (action === "reject") {
    await prisma.postedScore.delete({ where: { scoreId: parseInt(scoreId) } });
    return NextResponse.json({ message: "Score rejected and removed" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
