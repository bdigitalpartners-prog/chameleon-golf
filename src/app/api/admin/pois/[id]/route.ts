import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/pois/[id]
 * Update a single POI
 * Body: { category, ...fields }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const { category, ...data } = body;

  let result;
  switch (category) {
    case "dining":
      result = await prisma.courseNearbyDining.update({ where: { id }, data });
      break;
    case "lodging":
      result = await prisma.courseNearbyLodging.update({ where: { id }, data });
      break;
    case "attraction":
      result = await prisma.courseNearbyAttractions.update({ where: { id }, data });
      break;
    case "rv_park":
      result = await prisma.courseNearbyRvPark.update({ where: { id }, data });
      break;
    default:
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  return NextResponse.json(result);
}

/**
 * DELETE /api/admin/pois/[id]
 * Delete a single POI
 * Query: ?category=dining|lodging|attraction|rv_park
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const id = parseInt(params.id);
  const category = req.nextUrl.searchParams.get("category");

  if (isNaN(id) || !category) {
    return NextResponse.json({ error: "Invalid ID or category" }, { status: 400 });
  }

  switch (category) {
    case "dining":
      await prisma.courseNearbyDining.delete({ where: { id } });
      break;
    case "lodging":
      await prisma.courseNearbyLodging.delete({ where: { id } });
      break;
    case "attraction":
      await prisma.courseNearbyAttractions.delete({ where: { id } });
      break;
    case "rv_park":
      await prisma.courseNearbyRvPark.delete({ where: { id } });
      break;
    default:
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
