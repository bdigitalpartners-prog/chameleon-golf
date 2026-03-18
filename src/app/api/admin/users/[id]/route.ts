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
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        ratings: {
          include: {
            course: { select: { courseId: true, courseName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        scores: {
          include: {
            course: { select: { courseId: true, courseName: true } },
          },
          orderBy: { datePlayed: "desc" },
        },
        wishlists: {
          include: {
            course: { select: { courseId: true, courseName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        circleMemberships: {
          include: {
            circle: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            ratings: true,
            scores: true,
            wishlists: true,
            circleMemberships: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get activity log for this user
    const activityLog = await prisma.adminActivityLog.findMany({
      where: { targetUserId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      adminNotes: user.adminNotes,
      ghinNumber: user.ghinNumber,
      handicapIndex: user.handicapIndex ? Number(user.handicapIndex) : null,
      homeState: user.homeState,
      ghinVerified: user.ghinVerified,
      ghinVerifiedAt: user.ghinVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      instagramUrl: user.instagramUrl || null,
      twitterUrl: user.twitterUrl || null,
      facebookUrl: user.facebookUrl || null,
      tiktokUrl: user.tiktokUrl || null,
      websiteUrl: user.websiteUrl || null,
      stats: {
        ratings: user._count.ratings,
        scores: user._count.scores,
        wishlists: user._count.wishlists,
        circles: user._count.circleMemberships,
      },
      ratings: user.ratings.map((r) => ({
        ratingId: r.ratingId,
        courseId: r.courseId,
        courseName: r.course.courseName,
        overallRating: Number(r.overallRating),
        reviewTitle: r.reviewTitle,
        createdAt: r.createdAt,
      })),
      scores: user.scores.map((s) => ({
        scoreId: s.scoreId,
        courseId: s.courseId,
        courseName: s.course.courseName,
        totalScore: s.totalScore,
        datePlayed: s.datePlayed,
        verificationStatus: s.verificationStatus,
      })),
      wishlists: user.wishlists.map((w) => ({
        id: w.id,
        courseId: w.courseId,
        courseName: w.course.courseName,
        status: w.status,
        createdAt: w.createdAt,
      })),
      circles: user.circleMemberships.map((cm) => ({
        circleId: cm.circleId,
        circleName: cm.circle.name,
        role: cm.role,
        joinedAt: cm.joinedAt,
      })),
      activityLog,
    });
  } catch (err) {
    console.error("User detail error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
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
    const {
      role, isActive, status, adminNotes, ghinVerified,
      instagramUrl, twitterUrl, facebookUrl, tiktokUrl, websiteUrl,
      adminEmail, reason,
    } = body;

    // Get current user for change tracking
    const current = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true, status: true, isActive: true, ghinVerified: true },
    });
    if (!current) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: any = {};
    const logs: any[] = [];
    const admin = adminEmail || "admin";

    if (role !== undefined && role !== current.role) {
      data.role = role;
      logs.push({
        targetUserId: params.id,
        adminEmail: admin,
        action: "role_change",
        previousValue: current.role,
        newValue: role,
        reason,
      });
    }
    if (status !== undefined && status !== current.status) {
      data.status = status;
      if (status === "active") data.isActive = true;
      if (status === "suspended" || status === "banned") data.isActive = false;
      logs.push({
        targetUserId: params.id,
        adminEmail: admin,
        action: status === "active" ? "reactivate" : status,
        previousValue: current.status,
        newValue: status,
        reason,
      });
    }
    if (isActive !== undefined) data.isActive = isActive;
    if (adminNotes !== undefined) data.adminNotes = adminNotes || null;
    if (ghinVerified !== undefined) {
      data.ghinVerified = ghinVerified;
      data.ghinVerifiedAt = ghinVerified ? new Date() : null;
      logs.push({
        targetUserId: params.id,
        adminEmail: admin,
        action: ghinVerified ? "ghin_verify" : "ghin_unverify",
        previousValue: String(current.ghinVerified),
        newValue: String(ghinVerified),
        reason,
      });
    }
    if (instagramUrl !== undefined) data.instagramUrl = instagramUrl || null;
    if (twitterUrl !== undefined) data.twitterUrl = twitterUrl || null;
    if (facebookUrl !== undefined) data.facebookUrl = facebookUrl || null;
    if (tiktokUrl !== undefined) data.tiktokUrl = tiktokUrl || null;
    if (websiteUrl !== undefined) data.websiteUrl = websiteUrl || null;

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    // Create activity logs
    if (logs.length > 0) {
      await prisma.adminActivityLog.createMany({ data: logs });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { adminEmail, reason } = body;

    // Soft-delete: mark as deleted status
    await prisma.user.update({
      where: { id: params.id },
      data: { status: "deleted", isActive: false },
    });

    await prisma.adminActivityLog.create({
      data: {
        targetUserId: params.id,
        adminEmail: adminEmail || "admin",
        action: "soft_delete",
        newValue: "deleted",
        reason: reason || "Account deleted by admin",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("User delete error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
