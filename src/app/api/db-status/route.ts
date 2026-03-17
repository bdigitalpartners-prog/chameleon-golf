export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Temporary diagnostic - secured by obscure path + will be removed
  const secret = request.nextUrl.searchParams.get("s");
  if (secret !== "diag-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;

    const courseColumns = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      ORDER BY ordinal_position
    `;

    // Count rows in key tables
    const counts: Record<string, number | string> = {};
    const tableNames = [
      "courses", "architects", "architect_aliases", "architect_media",
      "course_architects", "external_content", "content_architect_links",
      "content_course_links", "books", "book_architect_links", "book_course_links",
      "ranking_entries", "ranking_lists", "ranking_sources",
      "users", "auth_users", "course_media", "airports",
      "course_intelligence_notes", "performance_articles",
      "course_nearby_dining", "course_nearby_lodging",
      "holes", "tee_boxes", "waitlist_signups"
    ];

    for (const t of tableNames) {
      try {
        const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "${t}"`
        );
        counts[t] = Number(result[0]?.count ?? 0);
      } catch {
        counts[t] = "TABLE_NOT_FOUND";
      }
    }

    // Check auth_users specifically
    let authUsers: any[] = [];
    try {
      authUsers = await prisma.$queryRawUnsafe(
        `SELECT id, email, first_name, created_at FROM "auth_users" LIMIT 10`
      );
    } catch (e: any) {
      authUsers = [{ error: e.message }];
    }

    // Check users table
    let usersTable: any[] = [];
    try {
      usersTable = await prisma.$queryRawUnsafe(
        `SELECT id, email, name, role FROM "users" LIMIT 10`
      );
    } catch (e: any) {
      usersTable = [{ error: e.message }];
    }

    return NextResponse.json({
      tables: tables.map((t) => t.tablename),
      tableCount: tables.length,
      rowCounts: counts,
      courseColumns: courseColumns.map((c) => `${c.column_name} (${c.data_type})`),
      authUsers,
      usersTable,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
