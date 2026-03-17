import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Verify user has access
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { participants: { select: { userId: true } } },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const hasAccess =
      trip.createdById === userId ||
      trip.participants.some((p) => p.userId === userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { description, amount, paidById, category, splitType, splitData } = body;

    if (!description || amount == null || amount <= 0) {
      return NextResponse.json(
        { error: "description and a positive amount are required" },
        { status: 400 }
      );
    }

    // Default paidById to the current user if not specified
    const expensePaidById = paidById ?? userId;

    // Verify paidBy user is a participant
    const isPaidByParticipant = trip.participants.some(
      (p) => p.userId === expensePaidById
    );
    if (!isPaidByParticipant && trip.createdById !== expensePaidById) {
      return NextResponse.json(
        { error: "paidBy user must be a trip participant" },
        { status: 400 }
      );
    }

    const expense = await prisma.tripExpense.create({
      data: {
        tripId: params.id,
        paidById: expensePaidById,
        description,
        amount: Number(amount),
        category: category ?? null,
        splitType: splitType ?? "equal",
        splitData: splitData ?? null,
      },
      include: {
        paidBy: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/trips/[id]/expenses error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Verify user has access
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { participants: { select: { userId: true } } },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const hasAccess =
      trip.createdById === userId ||
      trip.participants.some((p) => p.userId === userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expenses = await prisma.tripExpense.findMany({
      where: { tripId: params.id },
      include: {
        paidBy: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalAmount = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    return NextResponse.json({
      expenses,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  } catch (error: any) {
    console.error("GET /api/trips/[id]/expenses error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
