-- CreateTable: EQ Wrapped (annual personalized golfer reports)
CREATE TABLE "eq_wrapped" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "share_token" VARCHAR(64),
    "is_public" BOOLEAN NOT NULL DEFAULT FALSE,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eq_wrapped_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eq_wrapped_user_year_key" ON "eq_wrapped"("user_id", "year");
CREATE UNIQUE INDEX "eq_wrapped_share_token_key" ON "eq_wrapped"("share_token");
CREATE INDEX "eq_wrapped_user_id_idx" ON "eq_wrapped"("user_id");

-- CreateTable: Architect Relationships (genealogy / lineage)
CREATE TABLE "architect_relationships" (
    "id" SERIAL NOT NULL,
    "from_architect_id" INTEGER NOT NULL,
    "to_architect_id" INTEGER NOT NULL,
    "relationship_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "year_start" INTEGER,
    "year_end" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "architect_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "architect_relationships_from_to_type_key" ON "architect_relationships"("from_architect_id", "to_architect_id", "relationship_type");
CREATE INDEX "architect_relationships_from_idx" ON "architect_relationships"("from_architect_id");
CREATE INDEX "architect_relationships_to_idx" ON "architect_relationships"("to_architect_id");

-- CreateTable: Architect Design DNA (8-dimension scores)
CREATE TABLE "architect_design_dna" (
    "id" SERIAL NOT NULL,
    "architect_id" INTEGER NOT NULL,
    "naturalism" INTEGER NOT NULL DEFAULT 50,
    "strategic_depth" INTEGER NOT NULL DEFAULT 50,
    "visual_drama" INTEGER NOT NULL DEFAULT 50,
    "green_complexity" INTEGER NOT NULL DEFAULT 50,
    "bunker_artistry" INTEGER NOT NULL DEFAULT 50,
    "routing_genius" INTEGER NOT NULL DEFAULT 50,
    "minimalism" INTEGER NOT NULL DEFAULT 50,
    "playability" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "architect_design_dna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "architect_design_dna_architect_id_key" ON "architect_design_dna"("architect_id");

-- AddForeignKey
ALTER TABLE "eq_wrapped" ADD CONSTRAINT "eq_wrapped_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "architect_relationships" ADD CONSTRAINT "architect_relationships_from_fkey" FOREIGN KEY ("from_architect_id") REFERENCES "architects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "architect_relationships" ADD CONSTRAINT "architect_relationships_to_fkey" FOREIGN KEY ("to_architect_id") REFERENCES "architects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "architect_design_dna" ADD CONSTRAINT "architect_design_dna_architect_id_fkey" FOREIGN KEY ("architect_id") REFERENCES "architects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
