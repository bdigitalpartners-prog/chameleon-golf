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

  const users = await prisma.user.findMany({
    include: {
      _count: { select: { ratings: true, scores: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, role } = await req.json();
  if (!["user", "rater", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json(updated);
}
