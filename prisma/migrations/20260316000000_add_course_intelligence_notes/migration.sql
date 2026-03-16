-- CreateEnum
CREATE TYPE "IntelligenceNoteCategory" AS ENUM ('BEST_TIME_TO_VISIT', 'INSIDER_TIP', 'SIMILAR_COURSES', 'COURSE_STRATEGY', 'WHAT_TO_EXPECT', 'ACCESS_GUIDE');

-- CreateTable
CREATE TABLE "course_intelligence_notes" (
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
);

-- CreateIndex
CREATE INDEX "course_intelligence_notes_course_id_idx" ON "course_intelligence_notes"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_intelligence_notes_course_id_category_key" ON "course_intelligence_notes"("course_id", "category");

-- AddForeignKey
ALTER TABLE "course_intelligence_notes" ADD CONSTRAINT "course_intelligence_notes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;
