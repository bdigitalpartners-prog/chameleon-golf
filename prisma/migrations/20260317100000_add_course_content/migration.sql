-- CreateTable
CREATE TABLE "course_content" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "rich_description" TEXT,
    "what_to_expect" TEXT,
    "strategy_low_hcp" TEXT,
    "strategy_mid_hcp" TEXT,
    "strategy_high_hcp" TEXT,
    "three_things_to_know" JSONB,
    "first_timer_guide" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model_used" VARCHAR(100),

    CONSTRAINT "course_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_content_course_id_key" ON "course_content"("course_id");

-- AddForeignKey
ALTER TABLE "course_content" ADD CONSTRAINT "course_content_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;
