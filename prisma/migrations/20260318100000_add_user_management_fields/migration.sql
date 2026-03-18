-- Add user management fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS "admin_activity_log" (
    "id" SERIAL NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "admin_email" VARCHAR(255) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "details" TEXT,
    "previous_value" VARCHAR(255),
    "new_value" VARCHAR(255),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "admin_activity_log_target_user_id_idx" ON "admin_activity_log"("target_user_id");
CREATE INDEX IF NOT EXISTS "admin_activity_log_created_at_idx" ON "admin_activity_log"("created_at");

-- Add foreign key
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'admin_activity_log_target_user_id_fkey'
  ) THEN
    ALTER TABLE "admin_activity_log" ADD CONSTRAINT "admin_activity_log_target_user_id_fkey" 
    FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
