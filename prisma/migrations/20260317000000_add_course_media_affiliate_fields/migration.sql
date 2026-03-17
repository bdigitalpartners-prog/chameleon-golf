-- AlterTable: Add affiliate image management fields to course_media
ALTER TABLE "course_media" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "course_media" ADD COLUMN IF NOT EXISTS "source_url" VARCHAR(500);
