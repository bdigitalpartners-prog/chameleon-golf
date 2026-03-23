-- CreateTable: membership_tiers
CREATE TABLE "membership_tiers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price_yearly" DOUBLE PRECISION NOT NULL,
    "price_monthly" DOUBLE PRECISION,
    "features" TEXT NOT NULL,
    "max_feature" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_tiers_name_key" ON "membership_tiers"("name");
CREATE UNIQUE INDEX "membership_tiers_slug_key" ON "membership_tiers"("slug");

-- CreateTable: user_memberships
CREATE TABLE "user_memberships" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "payment_provider" TEXT,
    "payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable: b2b_course_profiles
CREATE TABLE "b2b_course_profiles" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimed_by" TEXT,
    "business_name" TEXT,
    "profile_tier" TEXT NOT NULL DEFAULT 'basic',
    "custom_description" TEXT,
    "featured_images" TEXT,
    "booking_url" TEXT,
    "website_url" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "social_links" TEXT,
    "amenities" TEXT,
    "special_offers" TEXT,
    "analytics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "monthly_views" INTEGER NOT NULL DEFAULT 0,
    "monthly_clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_course_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "b2b_course_profiles_course_id_key" ON "b2b_course_profiles"("course_id");

-- Seed membership tiers
INSERT INTO "membership_tiers" ("name", "slug", "price_yearly", "price_monthly", "features", "max_feature", "sort_order") VALUES
(
  'EQUALIZER PRO',
  'pro',
  99.0,
  9.99,
  '["Full course intelligence on every course page","Trip Planner with AI generation","AI Concierge 2.0 unlimited queries","Course-Fit personalized scores","Live conditions layer access","Course DNA fingerprint access","EQ Wrapped annual report","Walking & accessibility database","Creator content on course pages","50 course comparisons/month"]',
  'Full Course Intelligence',
  1
),
(
  'EQUALIZER ELITE',
  'elite',
  199.0,
  19.99,
  '["Everything in Pro","API access (future)","Data exports","Betting/DFS intelligence layer","Early access to new features","Green Fee Intelligence with price alerts","Satellite Feature Analysis data","Unlimited comparisons","Priority support"]',
  'Betting & DFS Intelligence',
  2
),
(
  'FOUNDERS FLIGHT',
  'founders',
  499.0,
  NULL,
  '["Everything in Elite","Exclusive community access","Private events and tee times access","The Vault (proprietary data room) — future","Direct line to product team","Founding member recognition badge","Lifetime locked-in pricing"]',
  'Lifetime Locked-In Pricing',
  3
);
