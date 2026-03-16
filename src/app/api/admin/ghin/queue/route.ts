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

  try {
    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }

    const [verifications, total, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        prisma.ghinVerification.findMany({
          where,
          include: {
            userProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            reviewer: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: (page - 1) * limit,
        }),
        prisma.ghinVerification.count({ where }),
        prisma.ghinVerification.count({ where: { status: "pending" } }),
        prisma.ghinVerification.count({ where: { status: "approved" } }),
        prisma.ghinVerification.count({ where: { status: "rejected" } }),
      ]);

    return NextResponse.json({
      verifications: verifications.map((v) => ({
        id: v.id,
        ghinNumber: v.ghinNumber,
        handicapIndex: v.handicapIndex,
        screenshotUrl: v.screenshotUrl,
        status: v.status,
        reviewNote: v.reviewNote,
        reviewedAt: v.reviewedAt,
        createdAt: v.createdAt,
        user: {
          id: v.userProfile.user.id,
          name: v.userProfile.user.name,
          email: v.userProfile.user.email,
          image: v.userProfile.user.image,
        },
        reviewer: v.reviewer,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (err) {
    console.error("GHIN queue error:", err);
    return NextResponse.json(
      { error: "Failed to fetch verification queue" },
      { status: 500 }
    );
  }
}
