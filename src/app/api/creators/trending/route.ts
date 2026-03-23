import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const platform = url.searchParams.get("platform");
    const contentType = url.searchParams.get("contentType");

    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

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

    whereClause += ` ORDER BY cc.published_at DESC NULLS LAST LIMIT $${paramIndex}`;
    params.push(limit);

    const content = await prisma.$queryRawUnsafe(`
      SELECT cc.*, c.course_name, c.city, c.state, c.course_id as linked_course_id
      FROM creator_content cc
      JOIN courses c ON c.course_id = cc.course_id
      ${whereClause}
    `, ...params);

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching trending content:", error);
    return NextResponse.json({ error: "Failed to fetch trending content" }, { status: 500 });
  }
}
