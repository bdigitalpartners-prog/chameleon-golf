import prisma from "@/lib/prisma";

/**
 * Log an admin action to the admin_audit_log table.
 * Silently fails if the table doesn't exist yet.
 */
export async function logAdminAction(params: {
  adminUser?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
}) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO admin_audit_log (admin_user, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      params.adminUser || "admin",
      params.action,
      params.entityType || null,
      params.entityId || null,
      params.details || null
    );
  } catch {
    // Table may not exist yet — silently ignore
  }
}
