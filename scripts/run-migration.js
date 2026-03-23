#!/usr/bin/env node

/**
 * Migration runner — executes SQL migration files against the database via Prisma.
 *
 * Usage:
 *   node scripts/run-migration.js
 *   node scripts/run-migration.js prisma/migrations/20260322_game_changer_features/migration.sql
 *
 * If no argument is provided, runs the latest migration by default.
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const DEFAULT_MIGRATION = path.resolve(
  __dirname,
  "../prisma/migrations/20260322_game_changer_features/migration.sql"
);

async function run() {
  const migrationPath = process.argv[2] || DEFAULT_MIGRATION;
  const absolutePath = path.resolve(migrationPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Migration file not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`Running migration: ${absolutePath}`);

  const sql = fs.readFileSync(absolutePath, "utf-8");

  // Split on semicolons, filter out empty/comment-only statements
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  const prisma = new PrismaClient();

  try {
    let executed = 0;
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        executed++;
      } catch (err) {
        // Log but continue — IF NOT EXISTS handles most conflicts
        console.warn(`Warning on statement ${executed + 1}: ${err.message}`);
      }
    }
    console.log(`Migration complete — ${executed} statements executed.`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
