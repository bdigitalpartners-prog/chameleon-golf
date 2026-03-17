export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Simple key check
  const key =
    request.headers.get("x-admin-key") ||
    request.nextUrl.searchParams.get("key");
  const validKey =
    process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY;
  
  // Also allow admin session
  if (!key && !validKey) {
    // If no keys configured, allow access (dev mode)
  } else if (key !== validKey) {
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

    return NextResponse.json({
      tables: tables.map((t) => t.tablename),
      tableCount: tables.length,
      rowCounts: counts,
      courseColumns: courseColumns.map((c) => `${c.column_name} (${c.data_type})`),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
