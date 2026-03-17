import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  try {
    // Ensure company_url column exists (safe migration)
    await prisma.$executeRawUnsafe(
      `ALTER TABLE architects ADD COLUMN IF NOT EXISTS company_url VARCHAR(500)`
    );

    const [architects, total] = await Promise.all([
      prisma.architect.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.architect.count({ where }),
    ]);

    return NextResponse.json({
      architects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin architects list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch architects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, slug, ...rest } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    const architect = await prisma.architect.create({
      data: { name, slug, ...rest },
    });

    return NextResponse.json(architect, { status: 201 });
  } catch (err) {
    console.error("Architect create error:", err);
    return NextResponse.json(
      { error: "Failed to create architect" },
      { status: 500 }
    );
  }
}
