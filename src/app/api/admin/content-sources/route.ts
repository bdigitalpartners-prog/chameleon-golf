import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const sources = await prisma.contentSource.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ sources });
  } catch (err: any) {
    console.error("Content sources fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
