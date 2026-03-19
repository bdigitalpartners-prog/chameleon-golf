import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Apply missing database columns and tables that Prisma schema expects.
 * This is a one-time migration endpoint to fix schema drift.
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const results: Record<string, string> = {};

  // 1. Add missing 'status' column to users
  try {
    await prisma.$executeRaw`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'active'
    `;
    results["users.status"] = "OK";
  } catch (e: any) {
    results["users.status"] = `ERROR: ${e.message}`;
  }

  // 2. Add missing 'admin_notes' column to users
  try {
    await prisma.$executeRaw`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT
    `;
    results["users.admin_notes"] = "OK";
  } catch (e: any) {
    results["users.admin_notes"] = `ERROR: ${e.message}`;
  }

  // 3. Add missing 'last_login_at' column to users
  try {
    await prisma.$executeRaw`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3)
    `;
    results["users.last_login_at"] = "OK";
  } catch (e: any) {
    results["users.last_login_at"] = `ERROR: ${e.message}`;
  }

  // 4. Create admin_activity_log table if it doesn't exist
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "admin_activity_log" (
        "id" SERIAL NOT NULL,
        "target_user_id" TEXT NOT NULL,
        "admin_email" VARCHAR(255) NOT NULL,
        "action" VARCHAR(50) NOT NULL,
        "details" TEXT,
        "previous_value" VARCHAR(255),
        "new_value" VARCHAR(255),
        "reason" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id")
      )
    `;
    results["admin_activity_log table"] = "OK";
  } catch (e: any) {
    results["admin_activity_log table"] = `ERROR: ${e.message}`;
  }

  // 5. Add indexes on admin_activity_log
  try {
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "admin_activity_log_target_user_id_idx" ON "admin_activity_log"("target_user_id")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "admin_activity_log_created_at_idx" ON "admin_activity_log"("created_at")
    `;
    results["admin_activity_log indexes"] = "OK";
  } catch (e: any) {
    results["admin_activity_log indexes"] = `ERROR: ${e.message}`;
  }

  // 6. Add foreign key from admin_activity_log to users
  try {
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'admin_activity_log_target_user_id_fkey'
        ) THEN
          ALTER TABLE "admin_activity_log" ADD CONSTRAINT "admin_activity_log_target_user_id_fkey" 
          FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$
    `;
    results["admin_activity_log FK"] = "OK";
  } catch (e: any) {
    results["admin_activity_log FK"] = `ERROR: ${e.message}`;
  }

  // 7. Verify fix worked - try the user query that was failing
  try {
    const user = await prisma.user.findFirst({
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
    results["verification_query"] = user ? `OK - found user ${user.name}` : "OK - no users";
  } catch (e: any) {
    results["verification_query"] = `STILL FAILING: ${e.message}`;
  }

  return NextResponse.json({
    success: !Object.values(results).some((v) => v.startsWith("ERROR") || v.startsWith("STILL")),
    results,
  });
}
