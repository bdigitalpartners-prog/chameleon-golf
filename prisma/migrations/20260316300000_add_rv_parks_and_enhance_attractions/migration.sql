-- CreateTable
CREATE TABLE "course_nearby_rv_parks" (
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
);

-- AlterTable: add rating, google_maps_url, sort_order to course_nearby_attractions
ALTER TABLE "course_nearby_attractions" ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3,1);
ALTER TABLE "course_nearby_attractions" ADD COLUMN IF NOT EXISTS "google_maps_url" VARCHAR(500);
ALTER TABLE "course_nearby_attractions" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "course_nearby_rv_parks_course_id_idx" ON "course_nearby_rv_parks"("course_id");

-- CreateIndex
CREATE INDEX "course_nearby_dining_course_id_idx" ON "course_nearby_dining"("course_id");

-- CreateIndex
CREATE INDEX "course_nearby_lodging_course_id_idx" ON "course_nearby_lodging"("course_id");

-- CreateIndex
CREATE INDEX "course_nearby_attractions_course_id_idx" ON "course_nearby_attractions"("course_id");

-- AddForeignKey
ALTER TABLE "course_nearby_rv_parks" ADD CONSTRAINT "course_nearby_rv_parks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;
