import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const expiresInDays = body.expiresInDays ?? 7;

    let code: string = "";
    let codeIsUnique = false;
    for (let attempts = 0; attempts < 10; attempts++) {
      code = generateCode();
      const existing = await prisma.circleInvite.findUnique({ where: { inviteCode: code } });
      if (!existing) {
        codeIsUnique = true;
        break;
      }
    }

    if (!codeIsUnique) {
      return NextResponse.json({ error: "Failed to generate a unique invite code. Please try again." }, { status: 500 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = await prisma.circleInvite.create({
      data: {
        circleId,
        inviterId: userId,
        inviteCode: code,
        expiresAt,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      code,
      url: `/circles/join/${code}`,
      expiresAt: invite.expiresAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/invite-code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
