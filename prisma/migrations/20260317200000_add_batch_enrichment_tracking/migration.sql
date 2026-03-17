-- CreateTable: batch_enrichment_runs
CREATE TABLE IF NOT EXISTS "batch_enrichment_runs" (
    "id" SERIAL NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "priority" VARCHAR(30) NOT NULL DEFAULT 'least-enriched',
    "batch_size" INTEGER NOT NULL DEFAULT 50,
    "total_courses" INTEGER NOT NULL DEFAULT 0,
    "courses_processed" INTEGER NOT NULL DEFAULT 0,
    "courses_updated" INTEGER NOT NULL DEFAULT 0,
    "courses_errored" INTEGER NOT NULL DEFAULT 0,
    "total_fields_filled" INTEGER NOT NULL DEFAULT 0,
    "avg_before" DECIMAL(5,2),
    "avg_after" DECIMAL(5,2),
    "error_summary" TEXT,
    "dry_run" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "batch_enrichment_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: course_enrichment_logs
CREATE TABLE IF NOT EXISTS "course_enrichment_logs" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER,
    "course_id" INTEGER NOT NULL,
    "course_name" VARCHAR(255) NOT NULL,
    "enriched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "before_pct" DECIMAL(5,2) NOT NULL,
    "after_pct" DECIMAL(5,2) NOT NULL,
    "fields_enriched" INTEGER NOT NULL DEFAULT 0,
    "rule_based_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ai_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "error_message" TEXT,

    CONSTRAINT "course_enrichment_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "course_enrichment_logs" ADD CONSTRAINT "course_enrichment_logs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "batch_enrichment_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_course_enrichment_logs_run_id" ON "course_enrichment_logs" ("run_id");
CREATE INDEX IF NOT EXISTS "idx_course_enrichment_logs_course_id" ON "course_enrichment_logs" ("course_id");
CREATE INDEX IF NOT EXISTS "idx_batch_enrichment_runs_status" ON "batch_enrichment_runs" ("status");
