import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ─── Trip Templates (stored in trip_templates table via raw SQL) ─── */

interface TemplateRow {
  id: number;
  slug: string;
  title: string;
  destination: string;
  region: string;
  description: string;
  days: number;
  estimated_cost_low: number;
  estimated_cost_high: number;
  image_url: string | null;
  courses_json: string;
  highlights: string | null;
  style: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    // Check if table exists, create if not
    await prisma.$queryRawUnsafe(`
      CREATE TABLE IF NOT EXISTS trip_templates (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        region VARCHAR(100) NOT NULL,
        description TEXT,
        days INTEGER NOT NULL,
        estimated_cost_low INTEGER,
        estimated_cost_high INTEGER,
        image_url VARCHAR(500),
        courses_json TEXT NOT NULL DEFAULT '[]',
        highlights TEXT,
        style VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const templates = await prisma.$queryRawUnsafe<TemplateRow[]>(`
      SELECT * FROM trip_templates ORDER BY id ASC
    `);

    const parsed = templates.map((t) => ({
      id: Number(t.id),
      slug: t.slug,
      title: t.title,
      destination: t.destination,
      region: t.region,
      description: t.description,
      days: t.days,
      estimatedCostLow: t.estimated_cost_low,
      estimatedCostHigh: t.estimated_cost_high,
      imageUrl: t.image_url,
      courses: JSON.parse(t.courses_json || "[]"),
      highlights: t.highlights ? JSON.parse(t.highlights) : [],
      style: t.style,
    }));

    return NextResponse.json({ templates: parsed });
  } catch (error: any) {
    console.error("GET /api/trips/templates error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
