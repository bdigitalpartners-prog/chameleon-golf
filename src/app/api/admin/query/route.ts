import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sql } = await req.json();
    if (!sql) return NextResponse.json({ error: "sql required" }, { status: 400 });
    
    const results = await prisma.$queryRawUnsafe(sql);
    // Convert BigInt to Number for JSON serialization
    const serialized = JSON.parse(JSON.stringify(results, (_, v) => 
      typeof v === 'bigint' ? Number(v) : v
    ));
    return NextResponse.json({ success: true, data: serialized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
