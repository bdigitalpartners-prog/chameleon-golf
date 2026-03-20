import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const offset = (page - 1) * limit;

  try {
    // Get verifications with user info
    const verifications = status !== "all"
      ? await prisma.$queryRaw<Array<any>>`
          SELECT 
            avq.queue_id, avq.ghin_number, avq.screenshot_url, avq.status,
            avq.review_notes, avq.submitted_at, avq.reviewed_at, avq.reviewed_by,
            u.id as user_id, u.name as user_name, u.email as user_email, u.image as user_image,
            u.handicap_index::float as handicap_index
          FROM admin_verification_queue avq
          LEFT JOIN users u ON u.id = avq.user_id
          WHERE avq.status = ${status}
          ORDER BY avq.submitted_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await prisma.$queryRaw<Array<any>>`
          SELECT 
            avq.queue_id, avq.ghin_number, avq.screenshot_url, avq.status,
            avq.review_notes, avq.submitted_at, avq.reviewed_at, avq.reviewed_by,
            u.id as user_id, u.name as user_name, u.email as user_email, u.image as user_image,
            u.handicap_index::float as handicap_index
          FROM admin_verification_queue avq
          LEFT JOIN users u ON u.id = avq.user_id
          ORDER BY avq.submitted_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

    // Count totals
    const counts = await prisma.$queryRaw<Array<{
      total: bigint;
      pending: bigint;
      approved: bigint;
      rejected: bigint;
    }>>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM admin_verification_queue
    `;

    const filteredCount = status !== "all"
      ? Number(counts[0]?.[status as keyof typeof counts[0]] ?? 0)
      : Number(counts[0]?.total ?? 0);

    return NextResponse.json({
      verifications: verifications.map((v: any) => ({
        id: String(v.queue_id),
        ghinNumber: v.ghin_number ?? "",
        handicapIndex: v.handicap_index,
        screenshotUrl: v.screenshot_url ?? "",
        status: v.status,
        reviewNote: v.review_notes,
        reviewedAt: v.reviewed_at,
        createdAt: v.submitted_at,
        user: {
          id: v.user_id ?? "",
          name: v.user_name,
          email: v.user_email,
          image: v.user_image,
        },
        reviewer: null,
      })),
      total: filteredCount,
      page,
      totalPages: Math.ceil(filteredCount / limit),
      stats: {
        pending: Number(counts[0]?.pending ?? 0),
        approved: Number(counts[0]?.approved ?? 0),
        rejected: Number(counts[0]?.rejected ?? 0),
      },
    });
  } catch (err: any) {
    console.error("GHIN queue error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to fetch verification queue" },
      { status: 500 }
    );
  }
}
