import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const creator = url.searchParams.get("creator");
    const platform = url.searchParams.get("platform");
    const contentType = url.searchParams.get("contentType");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (creator) {
      whereClause += ` AND (cc.creator_name ILIKE $${paramIndex} OR cc.creator_handle ILIKE $${paramIndex})`;
      params.push(`%${creator}%`);
      paramIndex++;
    }

    if (platform) {
      whereClause += ` AND cc.platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    if (contentType) {
      whereClause += ` AND cc.content_type = $${paramIndex}`;
      params.push(contentType);
      paramIndex++;
    }

    const content = await prisma.$queryRawUnsafe(`
      SELECT cc.*, c.course_name, c.city, c.state
      FROM creator_content cc
      JOIN courses c ON c.course_id = cc.course_id
      ${whereClause}
      ORDER BY cc.published_at DESC NULLS LAST
      LIMIT $${paramIndex}
    `, ...params, limit);

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error searching creator content:", error);
    return NextResponse.json({ error: "Failed to search creator content" }, { status: 500 });
  }
}
