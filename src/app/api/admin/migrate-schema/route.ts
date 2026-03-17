import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Comprehensive schema migration endpoint.
 * Applies all missing tables, columns, enums, indexes, and foreign keys
 * that exist in the Prisma schema but haven't been applied to the database.
 *
 * All statements use IF NOT EXISTS / IF EXISTS guards so this is safe to re-run.
 */
export async function POST(req: NextRequest) {
  const key =
    req.headers.get("x-admin-key") ||
    req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];
  const errors: string[] = [];

  async function run(sql: string, label?: string) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${label || sql.substring(0, 80)}...`);
    } catch (error: any) {
      // Skip "already exists" errors gracefully
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate")
      ) {
        results.push(`SKIP (already exists): ${label || sql.substring(0, 60)}...`);
      } else {
        errors.push(`ERROR: ${label || sql.substring(0, 60)} — ${error.message}`);
      }
    }
  }

  try {
    // =========================================================
    // 1. ENUMS (create if not exists)
    // =========================================================

    // IntelligenceNoteCategory
    await run(
      `DO $$ BEGIN
        CREATE TYPE "IntelligenceNoteCategory" AS ENUM (
          'BEST_TIME_TO_VISIT', 'INSIDER_TIP', 'SIMILAR_COURSES',
          'COURSE_STRATEGY', 'WHAT_TO_EXPECT', 'ACCESS_GUIDE'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$`,
      "Create enum IntelligenceNoteCategory"
    );

    // TokenTransactionType
    await run(
      `DO $$ BEGIN
        CREATE TYPE "TokenTransactionType" AS ENUM ('EARNED', 'SPENT', 'EXPIRED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$`,
      "Create enum TokenTransactionType"
    );

    // TokenSource
    await run(
      `DO $$ BEGIN
        CREATE TYPE "TokenSource" AS ENUM (
          'REVIEW', 'CHECK_IN', 'REFERRAL', 'ACHIEVEMENT', 'PURCHASE', 'ADMIN', 'PROFILE'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$`,
      "Create enum TokenSource"
    );

    // FoundersPhase
    await run(
      `DO $$ BEGIN
        CREATE TYPE "FoundersPhase" AS ENUM ('GROUND_ZERO', 'CHARTER_CLASS', 'LAST_CALL');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$`,
      "Create enum FoundersPhase"
    );

    // FoundersStatus
    await run(
      `DO $$ BEGIN
        CREATE TYPE "FoundersStatus" AS ENUM ('ACTIVE', 'EXPIRED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$`,
      "Create enum FoundersStatus"
    );

    // =========================================================
    // 2. COURSES TABLE — Add missing columns
    // =========================================================

    const courseColumns = [
      // Access & Policies
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS email TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS tagline TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_tier TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS dress_code TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS caddie_availability TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS caddie_fee TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS cart_policy TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS cart_fee TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS cell_phone_policy TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS practice_facilities JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS club_rental_available BOOLEAN`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS booking_url VARCHAR(500)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS how_to_get_on TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS resort_affiliate_access TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS guest_policy TEXT`,

      // Course Character & Insider Tips
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS signature_hole_number INTEGER`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS signature_hole_description TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS best_par3 JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS best_par4 JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS best_par5 JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS insider_tips JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_strategy TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_to_expect TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS best_time_to_play TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS pace_of_play_notes TEXT`,

      // Round & Pace
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS average_round_time VARCHAR(50)`,

      // Conditions
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS fairway_grass TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS green_grass TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS green_speed TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS aeration_schedule TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS best_condition_months TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS golf_season TEXT`,

      // Championship & History
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS championship_history JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS famous_moments JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS upcoming_events JSONB`,

      // Weather
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS weather_data JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS best_months JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS worst_months JSONB`,

      // Architecture
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS architect_bio TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS design_philosophy TEXT`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS template_holes JSONB`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS renovation_history JSONB`,

      // Lodging
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS on_site_lodging BOOLEAN`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS resort_name VARCHAR(255)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS resort_booking_url VARCHAR(500)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS stay_and_play_packages JSONB`,

      // Pricing Details
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS green_fee_peak DECIMAL(12,2)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS green_fee_off_peak DECIMAL(12,2)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS green_fee_twilight DECIMAL(12,2)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS includes_cart BOOLEAN`,

      // Logo (may already exist from prior migration)
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_local_path VARCHAR(500)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_source VARCHAR(200)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_background_color VARCHAR(20)`,
    ];

    for (const sql of courseColumns) {
      await run(sql, sql.replace("ALTER TABLE courses ADD COLUMN IF NOT EXISTS ", "courses."));
    }

    // =========================================================
    // 3. COURSE INTELLIGENCE NOTES TABLE
    // =========================================================

    await run(
      `CREATE TABLE IF NOT EXISTS "course_intelligence_notes" (
        "id" SERIAL NOT NULL,
        "course_id" INTEGER NOT NULL,
        "category" "IntelligenceNoteCategory" NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "icon" VARCHAR(50),
        "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "source" VARCHAR(100) NOT NULL DEFAULT 'COURSEfactor.ai',
        "is_visible" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "course_intelligence_notes_pkey" PRIMARY KEY ("id")
      )`,
      "Create table course_intelligence_notes"
    );

    await run(
      `CREATE INDEX IF NOT EXISTS "course_intelligence_notes_course_id_idx"
       ON "course_intelligence_notes"("course_id")`,
      "Index: course_intelligence_notes_course_id"
    );

    await run(
      `CREATE UNIQUE INDEX IF NOT EXISTS "course_intelligence_notes_course_id_category_key"
       ON "course_intelligence_notes"("course_id", "category")`,
      "Unique index: course_intelligence_notes(course_id, category)"
    );

    await run(
      `DO $$ BEGIN
        ALTER TABLE "course_intelligence_notes"
          ADD CONSTRAINT "course_intelligence_notes_course_id_fkey"
          FOREIGN KEY ("course_id") REFERENCES "courses"("course_id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$`,
      "FK: course_intelligence_notes -> courses"
    );

    // =========================================================
    // 4. ARCHITECTS TABLE
    // =========================================================

    await run(
      `CREATE TABLE IF NOT EXISTS "architects" (
        "id" SERIAL NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL,
        "born_year" INTEGER,
        "died_year" INTEGER,
        "nationality" VARCHAR(100),
        "bio" TEXT,
        "design_philosophy" TEXT,
        "signature_courses" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "notable_features" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "era" VARCHAR(50),
        "total_courses_designed" INTEGER,
        "image_url" VARCHAR(500),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "architects_pkey" PRIMARY KEY ("id")
      )`,
      "Create table architects"
    );

    await run(
      `CREATE UNIQUE INDEX IF NOT EXISTS "architects_name_key" ON "architects"("name")`,
      "Unique index: architects(name)"
    );
    await run(
      `CREATE UNIQUE INDEX IF NOT EXISTS "architects_slug_key" ON "architects"("slug")`,
      "Unique index: architects(slug)"
    );
    await run(
      `CREATE INDEX IF NOT EXISTS "architects_slug_idx" ON "architects"("slug")`,
      "Index: architects(slug)"
    );
    await run(
      `CREATE INDEX IF NOT EXISTS "architects_name_idx" ON "architects"("name")`,
      "Index: architects(name)"
    );

    // =========================================================
    // 5. EQ TOKENS & FOUNDERS TABLES
    // =========================================================

    await run(
      `CREATE TABLE IF NOT EXISTS "eq_token_transactions" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "amount" INTEGER NOT NULL,
        "type" "TokenTransactionType" NOT NULL,
        "source" "TokenSource" NOT NULL,
        "description" VARCHAR(500),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "eq_token_transactions_pkey" PRIMARY KEY ("id")
      )`,
      "Create table eq_token_transactions"
    );

    await run(
      `CREATE TABLE IF NOT EXISTS "token_earning_rules" (
        "id" TEXT NOT NULL,
        "source" "TokenSource" NOT NULL,
        "action" VARCHAR(100) NOT NULL,
        "amount" INTEGER NOT NULL,
        "description" VARCHAR(500),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "token_earning_rules_pkey" PRIMARY KEY ("id")
      )`,
      "Create table token_earning_rules"
    );

    await run(
      `CREATE TABLE IF NOT EXISTS "tier_configs" (
        "id" TEXT NOT NULL,
        "name" VARCHAR(50) NOT NULL,
        "threshold" INTEGER NOT NULL,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "features" JSONB NOT NULL DEFAULT '[]',
        "color" VARCHAR(20),
        "icon" VARCHAR(50),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tier_configs_pkey" PRIMARY KEY ("id")
      )`,
      "Create table tier_configs"
    );

    await run(
      `CREATE TABLE IF NOT EXISTS "founders_memberships" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "member_number" INTEGER NOT NULL,
        "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "tier" VARCHAR(50) NOT NULL DEFAULT 'FOUNDERS_FLIGHT',
        "status" "FoundersStatus" NOT NULL DEFAULT 'ACTIVE',
        "vault_access" BOOLEAN NOT NULL DEFAULT true,
        "badge_awarded" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "founders_memberships_pkey" PRIMARY KEY ("id")
      )`,
      "Create table founders_memberships"
    );

    await run(
      `CREATE TABLE IF NOT EXISTS "founders_invites" (
        "id" TEXT NOT NULL,
        "code" VARCHAR(50) NOT NULL,
        "created_by" TEXT NOT NULL,
        "used_by" TEXT,
        "used_at" TIMESTAMP(3),
        "phase" "FoundersPhase" NOT NULL,
        "expires_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "founders_invites_pkey" PRIMARY KEY ("id")
      )`,
      "Create table founders_invites"
    );

    // Indexes for eq/founders tables
    await run(`CREATE INDEX IF NOT EXISTS "eq_token_transactions_user_id_created_at_idx" ON "eq_token_transactions"("user_id", "created_at" DESC)`, "Index: eq_token_transactions(user_id, created_at)");
    await run(`CREATE INDEX IF NOT EXISTS "eq_token_transactions_type_idx" ON "eq_token_transactions"("type")`, "Index: eq_token_transactions(type)");
    await run(`CREATE INDEX IF NOT EXISTS "eq_token_transactions_source_idx" ON "eq_token_transactions"("source")`, "Index: eq_token_transactions(source)");
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "token_earning_rules_source_action_key" ON "token_earning_rules"("source", "action")`, "Unique index: token_earning_rules(source, action)");
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "tier_configs_name_key" ON "tier_configs"("name")`, "Unique index: tier_configs(name)");
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "founders_memberships_user_id_key" ON "founders_memberships"("user_id")`, "Unique index: founders_memberships(user_id)");
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "founders_memberships_member_number_key" ON "founders_memberships"("member_number")`, "Unique index: founders_memberships(member_number)");
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "founders_invites_code_key" ON "founders_invites"("code")`, "Unique index: founders_invites(code)");
    await run(`CREATE INDEX IF NOT EXISTS "founders_invites_phase_idx" ON "founders_invites"("phase")`, "Index: founders_invites(phase)");
    await run(`CREATE INDEX IF NOT EXISTS "founders_invites_created_by_idx" ON "founders_invites"("created_by")`, "Index: founders_invites(created_by)");

    // Foreign keys for eq/founders tables
    await run(`DO $$ BEGIN ALTER TABLE "eq_token_transactions" ADD CONSTRAINT "eq_token_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`, "FK: eq_token_transactions -> users");
    await run(`DO $$ BEGIN ALTER TABLE "founders_memberships" ADD CONSTRAINT "founders_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`, "FK: founders_memberships -> users");
    await run(`DO $$ BEGIN ALTER TABLE "founders_invites" ADD CONSTRAINT "founders_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`, "FK: founders_invites(created_by) -> users");
    await run(`DO $$ BEGIN ALTER TABLE "founders_invites" ADD CONSTRAINT "founders_invites_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`, "FK: founders_invites(used_by) -> users");

    // =========================================================
    // 6. NEARBY RV PARKS TABLE
    // =========================================================

    await run(
      `CREATE TABLE IF NOT EXISTS "course_nearby_rv_parks" (
        "id" SERIAL NOT NULL,
        "course_id" INTEGER NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "distance_miles" DECIMAL(6,1),
        "drive_time_minutes" INTEGER,
        "rating" DECIMAL(3,1),
        "price_level" VARCHAR(10),
        "num_sites" INTEGER,
        "hookups" VARCHAR(100),
        "amenities" TEXT,
        "address" TEXT,
        "phone" VARCHAR(50),
        "website_url" VARCHAR(500),
        "google_maps_url" VARCHAR(500),
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "course_nearby_rv_parks_pkey" PRIMARY KEY ("id")
      )`,
      "Create table course_nearby_rv_parks"
    );

    // Enhance existing attractions table
    await run(`ALTER TABLE "course_nearby_attractions" ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3,1)`, "attractions.rating");
    await run(`ALTER TABLE "course_nearby_attractions" ADD COLUMN IF NOT EXISTS "google_maps_url" VARCHAR(500)`, "attractions.google_maps_url");
    await run(`ALTER TABLE "course_nearby_attractions" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0`, "attractions.sort_order");

    // Indexes for POI tables
    await run(`CREATE INDEX IF NOT EXISTS "course_nearby_rv_parks_course_id_idx" ON "course_nearby_rv_parks"("course_id")`, "Index: course_nearby_rv_parks(course_id)");
    await run(`CREATE INDEX IF NOT EXISTS "course_nearby_dining_course_id_idx" ON "course_nearby_dining"("course_id")`, "Index: course_nearby_dining(course_id)");
    await run(`CREATE INDEX IF NOT EXISTS "course_nearby_lodging_course_id_idx" ON "course_nearby_lodging"("course_id")`, "Index: course_nearby_lodging(course_id)");
    await run(`CREATE INDEX IF NOT EXISTS "course_nearby_attractions_course_id_idx" ON "course_nearby_attractions"("course_id")`, "Index: course_nearby_attractions(course_id)");

    // FK for rv_parks
    await run(
      `DO $$ BEGIN
        ALTER TABLE "course_nearby_rv_parks"
          ADD CONSTRAINT "course_nearby_rv_parks_course_id_fkey"
          FOREIGN KEY ("course_id") REFERENCES "courses"("course_id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$`,
      "FK: course_nearby_rv_parks -> courses"
    );

    // =========================================================
    // 7. SEED REVIEW FIELDS on user_course_ratings
    // =========================================================

    await run(
      `ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "is_seed" BOOLEAN NOT NULL DEFAULT false`,
      "user_course_ratings.is_seed"
    );
    await run(
      `ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "seed_source" VARCHAR(200)`,
      "user_course_ratings.seed_source"
    );
    await run(
      `ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "seed_reviewer_name" VARCHAR(200)`,
      "user_course_ratings.seed_reviewer_name"
    );
    await run(
      `CREATE INDEX IF NOT EXISTS "idx_user_course_ratings_is_seed" ON "user_course_ratings" ("is_seed")`,
      "Index: user_course_ratings(is_seed)"
    );

    return NextResponse.json({
      success: true,
      totalOk: results.length,
      totalErrors: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        totalOk: results.length,
        totalErrors: errors.length,
        results,
        errors,
      },
      { status: 500 }
    );
  }
}
