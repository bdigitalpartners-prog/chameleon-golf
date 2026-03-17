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
    const aliases = await prisma.architectAlias.findMany({
      where: { architectId: parseInt(params.id, 10) },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(aliases);
  } catch (err) {
    console.error("Aliases list error:", err);
    return NextResponse.json({ error: "Failed to fetch aliases" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { aliasName, aliasType } = await request.json();
    if (!aliasName) {
      return NextResponse.json({ error: "aliasName is required" }, { status: 400 });
    }

    const alias = await prisma.architectAlias.create({
      data: {
        architectId: parseInt(params.id, 10),
        aliasName,
        aliasType: aliasType || "alternate",
      },
    });
    return NextResponse.json(alias, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Alias already exists" }, { status: 409 });
    }
    console.error("Alias create error:", err);
    return NextResponse.json({ error: "Failed to create alias" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const aliasId = url.searchParams.get("aliasId");
    if (!aliasId) {
      return NextResponse.json({ error: "aliasId query param required" }, { status: 400 });
    }

    await prisma.architectAlias.delete({
      where: { id: parseInt(aliasId, 10) },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Alias delete error:", err);
    return NextResponse.json({ error: "Failed to delete alias" }, { status: 500 });
  }
}
