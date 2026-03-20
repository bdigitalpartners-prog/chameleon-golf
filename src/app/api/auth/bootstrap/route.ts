import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * One-time DB migration endpoint. Adds missing columns to the users table
 * to align production DB with Prisma schema. REMOVE AFTER USE.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "bootstrap-2026-xyz") {
    return NextResponse.json({ error: "no" }, { status: 403 });
  }

  const action = req.nextUrl.searchParams.get("action") || "check";
  const results: string[] = [];

  try {
    // Get current users columns
    const currentCols: any[] = await prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
    );
    const existingCols = new Set(currentCols.map((c: any) => c.column_name));
    results.push(`Current users columns: ${[...existingCols].join(", ")}`);

    if (action === "check") {
      return NextResponse.json({ existingCols: [...existingCols], action: "check" });
    }

    if (action === "fix-nulls") {
      // Make username and password nullable so auth_users entries can sync
      const fixes: string[] = [];
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN username DROP NOT NULL`);
        fixes.push("username: dropped NOT NULL");
      } catch (e: any) { fixes.push(`username: ${e.message?.substring(0, 80)}`); }
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);
        fixes.push("password: dropped NOT NULL");
      } catch (e: any) { fixes.push(`password: ${e.message?.substring(0, 80)}`); }

      // Now sync all auth_users into users
      const authUsers: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, email, first_name, last_name FROM auth_users`
      );
      for (const au of authUsers) {
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO users (id, email, name, role, created_at, updated_at)
             VALUES ($1, $2, $3, 'user', NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET
               name = COALESCE(EXCLUDED.name, users.name),
               updated_at = NOW()`,
            au.id, au.email, `${au.first_name} ${au.last_name}`
          );
          fixes.push(`SYNC: ${au.email} ✅`);
        } catch (e: any) {
          // Try update by id if email conflict from existing admin row
          try {
            await prisma.$executeRawUnsafe(
              `UPDATE users SET email = $1, name = COALESCE($2, name), updated_at = NOW() WHERE id = $3`,
              au.email, `${au.first_name} ${au.last_name}`, au.id
            );
            fixes.push(`SYNC (update): ${au.email} ✅`);
          } catch (e2: any) {
            fixes.push(`SYNC FAIL: ${au.email} — ${e2.message?.substring(0, 80)}`);
          }
        }
      }

      const allUsers: any[] = await prisma.$queryRawUnsafe(`SELECT id, name, email, role FROM users`);
      return NextResponse.json({ action: "fix-nulls", fixes, users: allUsers });
    }

    if (action === "migrate") {
      // Define all columns that need to be added to match Prisma schema
      const columnsToAdd = [
        { name: "email", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE` },
        { name: "email_verified", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP(3)` },
        { name: "image", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT` },
        { name: "ghin_number", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS ghin_number VARCHAR(20)` },
        { name: "handicap_index", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS handicap_index DECIMAL(4,1)` },
        { name: "home_course_id", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS home_course_id INTEGER` },
        { name: "home_state", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS home_state VARCHAR(100)` },
        { name: "ghin_verified", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS ghin_verified BOOLEAN NOT NULL DEFAULT false` },
        { name: "ghin_verified_at", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS ghin_verified_at TIMESTAMP(3)` },
        { name: "ghin_last_synced", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS ghin_last_synced TIMESTAMP(3)` },
        { name: "is_active", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true` },
        { name: "status", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'` },
        { name: "admin_notes", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT` },
        { name: "last_login_at", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP(3)` },
        { name: "instagram_url", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500)` },
        { name: "twitter_url", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500)` },
        { name: "facebook_url", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500)` },
        { name: "tiktok_url", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(500)` },
        { name: "website_url", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url VARCHAR(500)` },
        { name: "created_at", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` },
        { name: "updated_at", sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` },
      ];

      let added = 0;
      let skipped = 0;

      for (const col of columnsToAdd) {
        if (existingCols.has(col.name)) {
          results.push(`SKIP: ${col.name} (already exists)`);
          skipped++;
          continue;
        }
        try {
          await prisma.$executeRawUnsafe(col.sql);
          results.push(`ADD: ${col.name} ✅`);
          added++;
        } catch (err: any) {
          results.push(`FAIL: ${col.name} — ${err.message}`);
        }
      }

      // Now populate email for existing users by joining with auth_users
      try {
        // Get all auth_users emails
        const authUsers: any[] = await prisma.$queryRawUnsafe(
          `SELECT id, email, first_name, last_name FROM auth_users`
        );
        results.push(`Found ${authUsers.length} auth_users entries`);

        // For the existing admin user, set email to Calvin's email
        const adminUpdate = await prisma.$executeRawUnsafe(
          `UPDATE users SET email = 'calvin@bdigitalpartners.com', created_at = NOW(), updated_at = NOW()
           WHERE role = 'admin' AND email IS NULL`
        );
        results.push(`Updated ${adminUpdate} admin users with Calvin's email`);

        // Create users entries for other auth_users that don't have a users row yet
        for (const au of authUsers) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO users (id, name, email, role, created_at, updated_at)
               VALUES ($1, $2, $3, 'user', NOW(), NOW())
               ON CONFLICT (id) DO UPDATE SET
                 email = COALESCE(users.email, EXCLUDED.email),
                 name = COALESCE(users.name, EXCLUDED.name)`,
              au.id,
              `${au.first_name} ${au.last_name}`,
              au.email
            );
            results.push(`SYNC: ${au.email} → users table`);
          } catch (err: any) {
            // If id conflict, try with email match
            try {
              await prisma.$executeRawUnsafe(
                `UPDATE users SET email = $1 WHERE email IS NULL AND name IS NOT NULL LIMIT 0`,
                au.email
              );
            } catch {}
            results.push(`SYNC NOTE: ${au.email} — ${err.message?.substring(0, 100)}`);
          }
        }
      } catch (err: any) {
        results.push(`AUTH_SYNC ERROR: ${err.message}`);
      }

      // Also create content_sources table if missing (Prisma model exists but table doesn't)
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS content_sources (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            url VARCHAR(500),
            rss_url VARCHAR(500),
            source_type VARCHAR(50) NOT NULL DEFAULT 'rss',
            is_active BOOLEAN NOT NULL DEFAULT true,
            last_fetched_at TIMESTAMP(3),
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        results.push("CREATE TABLE: content_sources ✅");
      } catch (err: any) {
        results.push(`CREATE TABLE content_sources: ${err.message}`);
      }

      // Verify the updated users schema
      const updatedCols: any[] = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
      );
      const finalCols = updatedCols.map((c: any) => c.column_name);

      // Show all users now
      const allUsers: any[] = await prisma.$queryRawUnsafe(`SELECT id, name, email, role FROM users`);

      return NextResponse.json({
        action: "migrate",
        added,
        skipped,
        finalColumns: finalCols,
        users: allUsers,
        details: results,
      });
    }

    return NextResponse.json({ error: "Unknown action. Use ?action=check or ?action=migrate" });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.substring(0, 500),
      results,
    }, { status: 500 });
  }
}
