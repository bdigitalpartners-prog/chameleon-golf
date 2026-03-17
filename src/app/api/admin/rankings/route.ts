import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "";
  const type = searchParams.get("type") || "";
  const year = searchParams.get("year") || "";
  const search = searchParams.get("search") || "";

  try {
    const where: any = {};
    if (source) where.sourceId = parseInt(source, 10);
    if (type) where.listType = type;
    if (year) where.yearPublished = parseInt(year, 10);
    if (search) where.listName = { contains: search, mode: "insensitive" };

    const [lists, sources, totalEntries] = await Promise.all([
      prisma.rankingList.findMany({
        where,
        include: {
          source: { select: { sourceName: true } },
          _count: { select: { entries: true } },
        },
        orderBy: [{ yearPublished: "desc" }, { listName: "asc" }],
      }),
      prisma.rankingSource.findMany({
        include: { _count: { select: { lists: true } } },
        orderBy: { sourceName: "asc" },
      }),
      prisma.rankingEntry.count(),
    ]);

    // Get data freshness per source
    const freshness = await prisma.$queryRaw<
      Array<{ source_id: number; source_name: string; total_lists: bigint; total_entries: bigint; last_entry: Date | null }>
    >`
      SELECT
        rs.source_id,
        rs.source_name,
        COUNT(DISTINCT rl.list_id)::bigint as total_lists,
        COUNT(re.entry_id)::bigint as total_entries,
        MAX(rl.year_published)::int as last_year
      FROM ranking_sources rs
      LEFT JOIN ranking_lists rl ON rs.source_id = rl.source_id
      LEFT JOIN ranking_entries re ON rl.list_id = re.list_id
      GROUP BY rs.source_id, rs.source_name
      ORDER BY rs.source_name
    `;

    return NextResponse.json({
      lists: lists.map((l) => ({
        listId: l.listId,
        sourceName: l.source.sourceName,
        sourceId: l.sourceId,
        listName: l.listName,
        listType: l.listType,
        region: l.region,
        yearPublished: l.yearPublished,
        cycleLabel: l.cycleLabel,
        prestigeTier: l.prestigeTier,
        listWeight: Number(l.listWeight),
        entriesCount: l._count.entries,
      })),
      sources: sources.map((s) => ({
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        listsCount: s._count.lists,
      })),
      totalSources: sources.length,
      totalLists: lists.length,
      totalEntries,
      freshness: freshness.map((f) => ({
        sourceId: Number(f.source_id),
        sourceName: f.source_name,
        totalLists: Number(f.total_lists),
        totalEntries: Number(f.total_entries),
        lastYear: (f as any).last_year ? Number((f as any).last_year) : null,
      })),
    });
  } catch (err) {
    console.error("Rankings list error:", err);
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { sourceId, listName, listType, region, yearPublished, cycleLabel, prestigeTier, listWeight, url } = body;

    if (!sourceId || !listName || !yearPublished) {
      return NextResponse.json({ error: "sourceId, listName, and yearPublished are required" }, { status: 400 });
    }

    // Ensure url column exists (migration safety)
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "ranking_lists" ADD COLUMN IF NOT EXISTS "url" VARCHAR(500)`
      );
    } catch { /* already exists */ }

    const list = await prisma.rankingList.create({
      data: {
        sourceId: parseInt(sourceId, 10),
        listName,
        listType: listType || null,
        region: region || null,
        yearPublished: parseInt(yearPublished, 10),
        cycleLabel: cycleLabel || null,
        prestigeTier: prestigeTier || "regional",
        listWeight: listWeight ? parseFloat(listWeight) : 0.4,
        url: url || null,
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (err) {
    console.error("Rankings create error:", err);
    return NextResponse.json({ error: "Failed to create ranking list" }, { status: 500 });
  }
}
