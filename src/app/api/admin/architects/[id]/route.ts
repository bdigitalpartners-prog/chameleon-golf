import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const architect = await prisma.architect.findUnique({
      where: { id: parseInt(params.id, 10) },
    });

    if (!architect) {
      return NextResponse.json(
        { error: "Architect not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(architect);
  } catch (err) {
    console.error("Admin architect detail error:", err);
    return NextResponse.json(
      { error: "Failed to fetch architect" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...data } = body;

    const architect = await prisma.architect.update({
      where: { id: parseInt(params.id, 10) },
      data,
    });

    return NextResponse.json(architect);
  } catch (err) {
    console.error("Architect update error:", err);
    return NextResponse.json(
      { error: "Failed to update architect" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    await prisma.architect.delete({
      where: { id: parseInt(params.id, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Architect delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete architect" },
      { status: 500 }
    );
  }
}
