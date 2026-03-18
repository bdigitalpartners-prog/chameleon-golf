import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Temporary bypass token for migration execution
const MIGRATION_TOKEN = "run-caddy-tables-2026";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (token !== MIGRATION_TOKEN) {
    const authErr = await checkAdminAuth(request);
    if (authErr) return authErr;
  }

  const results: string[] = [];

  try {
    // Create enums
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CaddyStatus') THEN
          CREATE TYPE "CaddyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CaddyRequestStatus') THEN
          CREATE TYPE "CaddyRequestStatus" AS ENUM ('PENDING', 'FULFILLED', 'CANCELLED');
        END IF;
      END $$;
    `);
    results.push("Enums created");

    // Create caddies table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "caddies" (
        "id" TEXT NOT NULL,
        "user_id" TEXT,
        "first_name" TEXT NOT NULL,
        "last_name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "bio" TEXT,
        "years_experience" INTEGER,
        "photo_url" TEXT,
        "status" "CaddyStatus" NOT NULL DEFAULT 'PENDING',
        "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "approved_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "caddies_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "caddies_user_id_key" ON "caddies"("user_id");`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "caddies_email_key" ON "caddies"("email");`);
    results.push("caddies table + indexes created");

    // Create caddy_courses table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "caddy_courses" (
        "id" TEXT NOT NULL,
        "caddy_id" TEXT NOT NULL,
        "course_id" INTEGER NOT NULL,
        "is_primary" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "caddy_courses_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "caddy_courses_caddy_id_course_id_key" ON "caddy_courses"("caddy_id", "course_id");`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_courses" DROP CONSTRAINT IF EXISTS "caddy_courses_caddy_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_courses" ADD CONSTRAINT "caddy_courses_caddy_id_fkey" FOREIGN KEY ("caddy_id") REFERENCES "caddies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_courses" DROP CONSTRAINT IF EXISTS "caddy_courses_course_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_courses" ADD CONSTRAINT "caddy_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("caddy_courses table created");

    // Create caddy_ratings table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "caddy_ratings" (
        "id" TEXT NOT NULL,
        "caddy_id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "course_id" INTEGER NOT NULL,
        "rating" INTEGER NOT NULL,
        "comment" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "caddy_ratings_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "caddy_ratings_caddy_id_user_id_course_id_key" ON "caddy_ratings"("caddy_id", "user_id", "course_id");`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_ratings" DROP CONSTRAINT IF EXISTS "caddy_ratings_caddy_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_ratings" ADD CONSTRAINT "caddy_ratings_caddy_id_fkey" FOREIGN KEY ("caddy_id") REFERENCES "caddies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_ratings" DROP CONSTRAINT IF EXISTS "caddy_ratings_user_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_ratings" ADD CONSTRAINT "caddy_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_ratings" DROP CONSTRAINT IF EXISTS "caddy_ratings_course_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_ratings" ADD CONSTRAINT "caddy_ratings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    results.push("caddy_ratings table created");

    // Create caddy_requests table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "caddy_requests" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "course_id" INTEGER NOT NULL,
        "play_date" TIMESTAMP(3),
        "group_size" INTEGER,
        "notes" TEXT,
        "status" "CaddyRequestStatus" NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "caddy_requests_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_requests" DROP CONSTRAINT IF EXISTS "caddy_requests_user_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_requests" ADD CONSTRAINT "caddy_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_requests" DROP CONSTRAINT IF EXISTS "caddy_requests_course_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_requests" ADD CONSTRAINT "caddy_requests_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    results.push("caddy_requests table created");

    // Create caddy_request_caddies table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "caddy_request_caddies" (
        "id" TEXT NOT NULL,
        "request_id" TEXT NOT NULL,
        "caddy_id" TEXT NOT NULL,
        CONSTRAINT "caddy_request_caddies_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "caddy_request_caddies_request_id_caddy_id_key" ON "caddy_request_caddies"("request_id", "caddy_id");`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_request_caddies" DROP CONSTRAINT IF EXISTS "caddy_request_caddies_request_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_request_caddies" ADD CONSTRAINT "caddy_request_caddies_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "caddy_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_request_caddies" DROP CONSTRAINT IF EXISTS "caddy_request_caddies_caddy_id_fkey"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "caddy_request_caddies" ADD CONSTRAINT "caddy_request_caddies_caddy_id_fkey" FOREIGN KEY ("caddy_id") REFERENCES "caddies"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    results.push("caddy_request_caddies table created");

    // Verify
    const tableCheck = await prisma.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('caddies', 'caddy_courses', 'caddy_ratings', 'caddy_requests', 'caddy_request_caddies')
      ORDER BY table_name;
    `) as any[];

    results.push(`Verified ${tableCheck.length} tables exist`);

    return NextResponse.json({ 
      success: true, 
      results,
      tables: tableCheck.map((t: any) => t.table_name)
    });

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      error: error.message, 
      results,
      code: error.code
    }, { status: 500 });
  }
}
