import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { sourceName, sourceUrl, methodologyNotes, authorityWeight } = body;

    if (!sourceName) {
      return NextResponse.json({ error: "sourceName is required" }, { status: 400 });
    }

    const source = await prisma.rankingSource.create({
      data: {
        sourceName,
        sourceUrl: sourceUrl || null,
        methodologyNotes: methodologyNotes || null,
        authorityWeight: authorityWeight ? parseFloat(authorityWeight) : 1.0,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    console.error("Source create error:", err);
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}
