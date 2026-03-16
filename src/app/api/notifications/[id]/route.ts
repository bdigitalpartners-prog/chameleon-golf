import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (notification.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
