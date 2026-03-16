import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const keyParam = req.nextUrl.searchParams.get("key");
  if (keyParam && keyParam === ADMIN_KEY) return true;
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === "admin";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") || undefined;

  const queue = await prisma.adminVerificationQueue.findMany({
    where: status ? { status } : undefined,
    orderBy: { submittedAt: "desc" },
  });

  // Fetch user info for each queue item
  const userIds = [...new Set(queue.map((q) => q.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, image: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const enriched = queue.map((q) => ({
    ...q,
    user: userMap[q.userId] || null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { queueId, action, reviewNotes } = await req.json();

  if (!queueId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const reviewerId = (session?.user as any)?.id || "admin-key";

  const item = await prisma.adminVerificationQueue.findUnique({
    where: { queueId },
  });

  if (!item) {
    return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  const updated = await prisma.adminVerificationQueue.update({
    where: { queueId },
    data: {
      status: newStatus,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || null,
    },
  });

  // If approved, update user's GHIN verification status
  if (action === "approve") {
    await prisma.user.update({
      where: { id: item.userId },
      data: {
        ghinVerified: true,
        ghinVerifiedAt: new Date(),
        ghinNumber: item.ghinNumber,
      },
    });
  }

  return NextResponse.json(updated);
}
