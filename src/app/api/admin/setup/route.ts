import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS admin_config (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by VARCHAR(100)
      )
    `);

    // Create audit log table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        admin_user VARCHAR(100),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed default values
    const defaults: Record<string, string> = {
      concierge_active_model: "sonar-pro",
      concierge_daily_budget_cap: "50",
      concierge_fallback_model: "sonar",
      concierge_auto_downgrade: "true",
      membership_tiers_enabled: "false",
      tier_free_model: "sonar",
      tier_free_daily_limit: "10",
      tier_member_model: "sonar-pro",
      tier_member_daily_limit: "100",
      tier_pro_model: "sonar-reasoning-pro",
      tier_pro_daily_limit: "unlimited",
    };

    for (const [key, value] of Object.entries(defaults)) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO admin_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        key,
        value
      );
    }

    return NextResponse.json({ success: true, message: "admin_config and admin_audit_log tables created and seeded" });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
