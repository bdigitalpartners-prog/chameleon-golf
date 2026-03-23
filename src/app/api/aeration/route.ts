import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Aeration history for a course
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 }
    );
  }

  try {
    const aerations = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ca.*,
              c."courseName" as course_name,
              u.name as reporter_name
       FROM course_aeration ca
       LEFT JOIN courses c ON c."courseId" = ca.course_id
       LEFT JOIN users u ON u.id = ca.reported_by
       WHERE ca.course_id = $1
       ORDER BY ca.start_date DESC NULLS LAST, ca.created_at DESC`,
      Number(courseId)
    );

    return NextResponse.json({ aerations });
  } catch (error) {
    console.error("GET /api/aeration error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aeration history" },
      { status: 500 }
    );
  }
}

// POST — Report aeration
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const {
      courseId,
      aerationType,
      startDate,
      endDate,
      recoveryWeeks,
      source,
      notes,
    } = body;

    if (!courseId || !aerationType) {
      return NextResponse.json(
        { error: "courseId and aerationType are required" },
        { status: 400 }
      );
    }

    const validTypes = ["greens", "fairways", "tees", "full_course"];
    if (!validTypes.includes(aerationType)) {
      return NextResponse.json(
        { error: "Invalid aerationType" },
        { status: 400 }
      );
    }

    const validSources = [
      "user_report",
      "course_website",
      "social_media",
      "phone_call",
    ];

    const result = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO course_aeration
        (course_id, aeration_type, start_date, end_date, recovery_weeks, source, reported_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      Number(courseId),
      aerationType,
      startDate || null,
      endDate || null,
      recoveryWeeks ? Number(recoveryWeeks) : null,
      source && validSources.includes(source) ? source : "user_report",
      userId,
      notes || null
    );

    return NextResponse.json({ aeration: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/aeration error:", error);
    return NextResponse.json(
      { error: "Failed to submit aeration report" },
      { status: 500 }
    );
  }
}
