import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test 1: Can we query the admin_verification_queue table?
    const count = await prisma.adminVerificationQueue.count();
    
    // Test 2: Try a test insert and immediately delete
    let insertResult = "not attempted";
    try {
      const testEntry = await prisma.adminVerificationQueue.create({
        data: {
          userId: "debug-test-" + Date.now(),
          scoreId: 0,
          courseId: 0,
          ghinNumber: "0000000",
          status: "debug",
        },
      });
      // Clean up
      await prisma.adminVerificationQueue.delete({
        where: { queueId: testEntry.queueId },
      });
      insertResult = "success";
    } catch (insertErr: any) {
      insertResult = `FAILED: ${insertErr.code || ""} ${insertErr.message}`;
    }

    // Test 3: Check column types
    let columnInfo = "not attempted";
    try {
      const cols = await prisma.$queryRaw`
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'admin_verification_queue'
        ORDER BY ordinal_position
      `;
      columnInfo = JSON.stringify(cols);
    } catch (colErr: any) {
      columnInfo = `FAILED: ${colErr.message}`;
    }

    return NextResponse.json({
      queueCount: count,
      insertTest: insertResult,
      columnInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      meta: error.meta,
    }, { status: 500 });
  }
}
