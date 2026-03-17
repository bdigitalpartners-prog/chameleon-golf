-- AlterTable: Add seed review tracking fields to user_course_ratings
ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "is_seed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "seed_source" VARCHAR(200);
ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "seed_reviewer_name" VARCHAR(200);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_course_ratings_is_seed" ON "user_course_ratings" ("is_seed");
