import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const rules = await prisma.tokenEarningRule.findMany({
      orderBy: [{ source: "asc" }, { amount: "desc" }],
    });
    return NextResponse.json(rules);
  } catch (err) {
    console.error("Token rules GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch token earning rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { source, action, amount, description } = body;

    if (!source || !action || amount == null) {
      return NextResponse.json(
        { error: "source, action, and amount are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.tokenEarningRule.upsert({
      where: { source_action: { source, action } },
      update: { amount, description },
      create: { source, action, amount, description },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (err) {
    console.error("Token rules POST error:", err);
    return NextResponse.json(
      { error: "Failed to save token earning rule" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Rule id is required" },
        { status: 400 }
      );
    }

    const rule = await prisma.tokenEarningRule.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(rule);
  } catch (err) {
    console.error("Token rules PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update token earning rule" },
      { status: 500 }
    );
  }
}
