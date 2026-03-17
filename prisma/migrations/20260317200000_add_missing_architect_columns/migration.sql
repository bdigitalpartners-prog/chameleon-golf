-- Add missing columns to architects table
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "website_url" VARCHAR(500);
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "firm_name" VARCHAR(255);
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "company_url" VARCHAR(500);
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "hero_image_url" VARCHAR(500);
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "portrait_url" VARCHAR(500);
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "is_partnership" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "instagram_url" VARCHAR(500);
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "twitter_url" VARCHAR(500);
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "facebook_url" VARCHAR(500);
ALTER TABLE "architects" ADD COLUMN IF NOT EXISTS "tiktok_url" VARCHAR(500);

-- Add missing columns to courses table
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "architect_id" INTEGER;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "instagram_url" VARCHAR(500);
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "twitter_url" VARCHAR(500);
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "facebook_url" VARCHAR(500);
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tiktok_url" VARCHAR(500);

-- Add foreign key constraint for architect_id (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'courses_architect_id_fkey'
      AND table_name = 'courses'
  ) THEN
    ALTER TABLE "courses"
      ADD CONSTRAINT "courses_architect_id_fkey"
      FOREIGN KEY ("architect_id") REFERENCES "architects"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Index for architect lookups
CREATE INDEX IF NOT EXISTS "courses_architect_id_idx" ON "courses"("architect_id");
