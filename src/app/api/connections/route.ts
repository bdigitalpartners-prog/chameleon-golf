import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const senderId = (session.user as any).id;
    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
    }

    if (senderId === receiverId) {
      return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
    }

    // Check receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for existing connection in either direction
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "BLOCKED") {
        return NextResponse.json({ error: "Cannot send connection request" }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Connection already exists", connection: existing },
        { status: 409 }
      );
    }

    const connection = await prisma.connection.create({
      data: { senderId, receiverId },
    });

    // Notify the receiver
    await createNotification({
      userId: receiverId,
      type: "CONNECTION_REQUEST",
      title: `${session.user?.name ?? "Someone"} sent you a connection request`,
      actionUrl: `/profile/${senderId}`,
      metadata: { connectionId: connection.id, senderId },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/connections error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "ACCEPTED";
    const direction = searchParams.get("direction"); // "sent" | "received" | null (both)

    const where: any = { status };

    if (direction === "sent") {
      where.senderId = userId;
    } else if (direction === "received") {
      where.receiverId = userId;
    } else {
      where.OR = [{ senderId: userId }, { receiverId: userId }];
    }

    const connections = await prisma.connection.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(connections);
  } catch (error: any) {
    console.error("GET /api/connections error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
