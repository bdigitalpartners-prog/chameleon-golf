import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const results: Record<string, any> = {};

  // Step 1: Check raw SQL - does users table exist?
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_course_ratings', 'posted_scores', 'course_wishlists', 'circle_memberships', 'admin_activity_log')
      ORDER BY table_name
    `;
    results.tables = tables;
  } catch (e: any) {
    results.tables_error = e.message;
  }

  // Step 2: Check users table columns
  try {
    const cols = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    results.user_columns = cols;
  } catch (e: any) {
    results.user_columns_error = e.message;
  }

  // Step 3: Try simple user count
  try {
    const count = await prisma.user.count();
    results.user_count = count;
  } catch (e: any) {
    results.user_count_error = e.message;
  }

  // Step 4: Try user findFirst without _count
  try {
    const user = await prisma.user.findFirst({
      select: { id: true, name: true, email: true },
    });
    results.first_user = user;
  } catch (e: any) {
    results.first_user_error = e.message;
  }

  // Step 5: Try user findFirst with _count
  try {
    const user = await prisma.user.findFirst({
      include: {
        _count: {
          select: {
            ratings: true,
            scores: true,
            wishlists: true,
            circleMemberships: true,
          },
        },
      },
    });
    results.user_with_count = user ? { id: user.id, _count: user._count } : null;
  } catch (e: any) {
    results.user_with_count_error = e.message;
  }

  // Step 6: Check if Prisma migration table exists
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 5
    `;
    results.recent_migrations = migrations;
  } catch (e: any) {
    results.migrations_error = e.message;
  }

  return NextResponse.json(results);
}
