import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const VALID_ACTIONS = ["dismiss", "remove_content", "warn_user", "ban_user"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminId = (session.user as any).id;
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const report = await prisma.contentReport.findUnique({
      where: { id: params.id },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      dismiss: "DISMISSED",
      remove_content: "ACTIONED",
      warn_user: "ACTIONED",
      ban_user: "ACTIONED",
    };

    const updated = await prisma.contentReport.update({
      where: { id: params.id },
      data: {
        status: statusMap[action],
        reviewedBy: adminId,
        reviewedAt: new Date(),
        details: notes ? `${report.details || ""}\n\nAdmin note: ${notes}` : report.details,
      },
    });

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error("Failed to review report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
