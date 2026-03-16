import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface AuditLogRow {
  id: number;
  admin_user: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: Date;
}

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const action = searchParams.get("action") || "";
    const limit = 25;
    const offset = (page - 1) * limit;

    let rows: AuditLogRow[];
    let totalCount: [{ count: bigint }];

    if (action) {
      rows = await prisma.$queryRaw<AuditLogRow[]>`
        SELECT id, admin_user, action, entity_type, entity_id, details, created_at
        FROM admin_audit_log
        WHERE action = ${action}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalCount = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM admin_audit_log WHERE action = ${action}
      `;
    } else {
      rows = await prisma.$queryRaw<AuditLogRow[]>`
        SELECT id, admin_user, action, entity_type, entity_id, details, created_at
        FROM admin_audit_log
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalCount = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM admin_audit_log
      `;
    }

    const total = Number(totalCount[0]?.count || 0);

    // Get distinct action types for filter dropdown
    const actionTypes = await prisma.$queryRaw<Array<{ action: string }>>`
      SELECT DISTINCT action FROM admin_audit_log ORDER BY action
    `;

    return NextResponse.json({
      logs: rows.map((r) => ({
        id: r.id,
        adminUser: r.admin_user,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        details: r.details,
        createdAt: r.created_at,
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      actionTypes: actionTypes.map((a) => a.action),
    });
  } catch (err) {
    console.error("Audit log error:", err);
    // Table may not exist
    return NextResponse.json({
      logs: [],
      totalPages: 0,
      currentPage: 1,
      total: 0,
      actionTypes: [],
      error: "Audit log table may not exist. Run POST /api/admin/setup first.",
    });
  }
}
