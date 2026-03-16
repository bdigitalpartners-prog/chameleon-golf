-- CreateEnum
CREATE TYPE "TokenTransactionType" AS ENUM ('EARNED', 'SPENT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TokenSource" AS ENUM ('REVIEW', 'CHECK_IN', 'REFERRAL', 'ACHIEVEMENT', 'PURCHASE', 'ADMIN', 'PROFILE');

-- CreateEnum
CREATE TYPE "FoundersPhase" AS ENUM ('GROUND_ZERO', 'CHARTER_CLASS', 'LAST_CALL');

-- CreateEnum
CREATE TYPE "FoundersStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateTable
CREATE TABLE "eq_token_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TokenTransactionType" NOT NULL,
    "source" "TokenSource" NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eq_token_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_earning_rules" (
    "id" TEXT NOT NULL,
    "source" "TokenSource" NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_earning_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_configs" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "threshold" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL DEFAULT '[]',
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founders_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "member_number" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tier" VARCHAR(50) NOT NULL DEFAULT 'FOUNDERS_FLIGHT',
    "status" "FoundersStatus" NOT NULL DEFAULT 'ACTIVE',
    "vault_access" BOOLEAN NOT NULL DEFAULT true,
    "badge_awarded" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "founders_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founders_invites" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "created_by" TEXT NOT NULL,
    "used_by" TEXT,
    "used_at" TIMESTAMP(3),
    "phase" "FoundersPhase" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "founders_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eq_token_transactions_user_id_created_at_idx" ON "eq_token_transactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "eq_token_transactions_type_idx" ON "eq_token_transactions"("type");

-- CreateIndex
CREATE INDEX "eq_token_transactions_source_idx" ON "eq_token_transactions"("source");

-- CreateIndex
CREATE UNIQUE INDEX "token_earning_rules_source_action_key" ON "token_earning_rules"("source", "action");

-- CreateIndex
CREATE UNIQUE INDEX "tier_configs_name_key" ON "tier_configs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "founders_memberships_user_id_key" ON "founders_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "founders_memberships_member_number_key" ON "founders_memberships"("member_number");

-- CreateIndex
CREATE UNIQUE INDEX "founders_invites_code_key" ON "founders_invites"("code");

-- CreateIndex
CREATE INDEX "founders_invites_phase_idx" ON "founders_invites"("phase");

-- CreateIndex
CREATE INDEX "founders_invites_created_by_idx" ON "founders_invites"("created_by");

-- AddForeignKey
ALTER TABLE "eq_token_transactions" ADD CONSTRAINT "eq_token_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founders_memberships" ADD CONSTRAINT "founders_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founders_invites" ADD CONSTRAINT "founders_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founders_invites" ADD CONSTRAINT "founders_invites_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
