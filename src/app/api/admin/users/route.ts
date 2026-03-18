import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const url = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(url.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.get("limit") || "25")));
    const search = url.get("search") || "";
    const role = url.get("role") || "";
    const status = url.get("status") || "";
    const sortBy = url.get("sortBy") || "createdAt";
    const sortOrder = (url.get("sortOrder") || "desc") as "asc" | "desc";
    const exportCsv = url.get("export") === "csv";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy
    const validSortFields: Record<string, any> = {
      name: { name: sortOrder },
      email: { email: sortOrder },
      createdAt: { createdAt: sortOrder },
      role: { role: sortOrder },
      status: { status: sortOrder },
    };
    const orderBy = validSortFields[sortBy] || { createdAt: "desc" };

    // For CSV export, get all matching users without pagination
    if (exportCsv) {
      const users = await prisma.user.findMany({
        where,
        orderBy,
        include: {
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

      const csvHeader = "ID,Name,Email,Role,Status,Signup Date,Last Login,Ratings,Scores,Wishlists,Circles\n";
      const csvRows = users.map((u) => {
        return [
          u.id,
          `"${(u.name || "").replace(/"/g, '""')}"`,
          `"${(u.email || "").replace(/"/g, '""')}"`,
          u.role,
          u.status,
          u.createdAt.toISOString().split("T")[0],
          u.lastLoginAt ? u.lastLoginAt.toISOString().split("T")[0] : "",
          u._count.ratings,
          u._count.scores,
          u._count.wishlists,
          u._count.circleMemberships,
        ].join(",");
      }).join("\n");

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
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

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        status: u.status,
        isActive: u.isActive,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        activityCount:
          u._count.ratings + u._count.scores + u._count.wishlists + u._count.circleMemberships,
        _count: u._count,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Users list error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { userIds, action, value, adminEmail, reason } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "No users selected" }, { status: 400 });
    }

    const admin = adminEmail || "admin";

    if (action === "changeRole") {
      if (!["user", "moderator", "admin"].includes(value)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { role: value },
      });
      // Log bulk action
      for (const uid of userIds) {
        await prisma.adminActivityLog.create({
          data: {
            targetUserId: uid,
            adminEmail: admin,
            action: "role_change",
            newValue: value,
            reason: reason || `Bulk role change to ${value}`,
          },
        });
      }
    } else if (action === "suspend") {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: "suspended", isActive: false },
      });
      for (const uid of userIds) {
        await prisma.adminActivityLog.create({
          data: {
            targetUserId: uid,
            adminEmail: admin,
            action: "suspend",
            newValue: "suspended",
            reason: reason || "Bulk suspend",
          },
        });
      }
    } else if (action === "activate") {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: "active", isActive: true },
      });
      for (const uid of userIds) {
        await prisma.adminActivityLog.create({
          data: {
            targetUserId: uid,
            adminEmail: admin,
            action: "reactivate",
            newValue: "active",
            reason: reason || "Bulk activate",
          },
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, affected: userIds.length });
  } catch (err) {
    console.error("Bulk action error:", err);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
