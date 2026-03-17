import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json(
        { error: "notificationId is required" },
        { status: 400 }
      );
    }

    // Verify the notification belongs to the user before dismissing
    const notification = await prisma.proactiveNotification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    await prisma.proactiveNotification.update({
      where: { id: notificationId },
      data: { isDismissed: true, isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/ai/notifications/dismiss error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
