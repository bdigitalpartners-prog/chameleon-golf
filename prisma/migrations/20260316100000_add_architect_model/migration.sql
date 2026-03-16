-- CreateTable
CREATE TABLE "architects" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX "architects_name_key" ON "architects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "architects_slug_key" ON "architects"("slug");

-- CreateIndex
CREATE INDEX "architects_slug_idx" ON "architects"("slug");

-- CreateIndex
CREATE INDEX "architects_name_idx" ON "architects"("name");
