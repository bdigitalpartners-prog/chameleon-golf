import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/pois?courseId=123
 * List all POIs for a course
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const id = parseInt(courseId);
  const [dining, lodging, attractions, rvParks] = await Promise.all([
    prisma.courseNearbyDining.findMany({
      where: { courseId: id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.courseNearbyLodging.findMany({
      where: { courseId: id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.courseNearbyAttractions.findMany({
      where: { courseId: id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.courseNearbyRvPark.findMany({
      where: { courseId: id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return NextResponse.json({ dining, lodging, attractions, rvParks });
}

/**
 * POST /api/admin/pois
 * Create a single POI
 * Body: { category: "dining"|"lodging"|"attraction"|"rv_park", courseId, ...fields }
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const { category, courseId, ...data } = body;

  if (!category || !courseId) {
    return NextResponse.json({ error: "category and courseId required" }, { status: 400 });
  }

  let result;
  switch (category) {
    case "dining":
      result = await prisma.courseNearbyDining.create({ data: { courseId, ...data } });
      break;
    case "lodging":
      result = await prisma.courseNearbyLodging.create({ data: { courseId, ...data } });
      break;
    case "attraction":
      result = await prisma.courseNearbyAttractions.create({ data: { courseId, ...data } });
      break;
    case "rv_park":
      result = await prisma.courseNearbyRvPark.create({ data: { courseId, ...data } });
      break;
    default:
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}

/**
 * DELETE /api/admin/pois
 * Delete all POIs for a course
 * Body: { courseId }
 */
export async function DELETE(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const { courseId } = body;

  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const [d, l, a, r] = await Promise.all([
    prisma.courseNearbyDining.deleteMany({ where: { courseId } }),
    prisma.courseNearbyLodging.deleteMany({ where: { courseId } }),
    prisma.courseNearbyAttractions.deleteMany({ where: { courseId } }),
    prisma.courseNearbyRvPark.deleteMany({ where: { courseId } }),
  ]);

  return NextResponse.json({
    deleted: {
      dining: d.count,
      lodging: l.count,
      attractions: a.count,
      rvParks: r.count,
    },
  });
}
