import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Create the concierge_usage table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS concierge_usage (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        user_ip VARCHAR(45),
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        estimated_cost DECIMAL(10,6) NOT NULL,
        request_fee DECIMAL(10,6) NOT NULL DEFAULT 0.006,
        total_cost DECIMAL(10,6) NOT NULL,
        model VARCHAR(50) NOT NULL DEFAULT 'sonar-pro',
        message_preview VARCHAR(200),
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verify it exists
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM concierge_usage`;

    return NextResponse.json({
      success: true,
      message: "concierge_usage table created successfully",
      currentRows: count,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
