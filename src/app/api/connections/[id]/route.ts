import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

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
    const { action } = await req.json();

    if (!["accept", "decline", "block"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be accept, decline, or block" },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.findUnique({
      where: { id: params.id },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Only the receiver can accept/decline; either party can block
    if (action !== "block" && connection.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "block" && connection.senderId !== userId && connection.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "decline") {
      await prisma.connection.delete({ where: { id: params.id } });
      return NextResponse.json({ message: "Connection declined" });
    }

    const newStatus = action === "accept" ? "ACCEPTED" : "BLOCKED";
    const updated = await prisma.connection.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    // Notify sender when accepted
    if (action === "accept") {
      await createNotification({
        userId: connection.senderId,
        type: "CONNECTION_ACCEPTED",
        title: `${session.user?.name ?? "Someone"} accepted your connection request`,
        actionUrl: `/profile/${userId}`,
        metadata: { connectionId: connection.id },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/connections/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
