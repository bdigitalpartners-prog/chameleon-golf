import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.course_id || !item.platform || !item.creator_name || !item.content_url) {
        skipped++;
        continue;
      }

      try {
        await prisma.$queryRawUnsafe(`
          INSERT INTO creator_content (course_id, platform, creator_name, creator_handle, content_url, title, thumbnail_url, published_at, view_count, content_type, is_verified, auto_tagged)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT DO NOTHING
        `,
          item.course_id,
          item.platform,
          item.creator_name,
          item.creator_handle || null,
          item.content_url,
          item.title || null,
          item.thumbnail_url || null,
          item.published_at ? new Date(item.published_at) : null,
          item.view_count || null,
          item.content_type || null,
          item.is_verified || false,
          item.auto_tagged || false
        );
        imported++;
      } catch (err) {
        console.error("Error importing item:", err);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, total: items.length }, { status: 201 });
  } catch (error) {
    console.error("Error importing creator content:", error);
    return NextResponse.json({ error: "Failed to import creator content" }, { status: 500 });
  }
}
