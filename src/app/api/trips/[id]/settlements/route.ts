import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  calculateSettlements,
  type Expense,
} from "@/lib/trips/settlements";

export const dynamic = "force-dynamic";

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
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
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

    // Get all expenses for this trip
    const dbExpenses = await prisma.tripExpense.findMany({
      where: { tripId: params.id },
      include: {
        paidBy: { select: { id: true, name: true } },
      },
    });

    // Build name map for friendly output
    const nameMap: Record<string, string> = {};
    for (const p of trip.participants) {
      nameMap[p.userId] = p.user.name ?? p.user.id;
    }

    // All participant IDs for equal splits
    const allParticipantIds = trip.participants.map((p) => p.userId);

    // Convert DB expenses to settlement calculator format
    const expenses: Expense[] = dbExpenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      paidById: e.paidById,
      paidByName: e.paidBy.name ?? undefined,
      splitType: (e.splitType as "equal" | "custom" | "percentage") ?? "equal",
      splitData: e.splitData as Expense["splitData"],
      allParticipantIds,
    }));

    const result = calculateSettlements(expenses, nameMap);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/trips/[id]/settlements error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
