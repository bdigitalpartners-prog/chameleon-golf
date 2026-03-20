import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    // Test 1: Count queue entries
    const count = await prisma.adminVerificationQueue.count();
    
    // Test 2: Check if current user exists in users table
    let userCheck = "not logged in";
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, ghinNumber: true, handicapIndex: true },
        });
        userCheck = user ? JSON.stringify(user) : `NOT FOUND for id=${userId}`;
      } catch (userErr: any) {
        userCheck = `FAILED: ${userErr.code || ""} ${userErr.message}`;
      }
    }

    // Test 3: Try updating user with a handicap value
    let updateTest = "not logged in";
    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { ghinNumber: "00000000" },
        });
        // Revert
        await prisma.user.update({
          where: { id: userId },
          data: { ghinNumber: null },
        });
        updateTest = "success";
      } catch (updateErr: any) {
        updateTest = `FAILED: ${updateErr.code || ""} ${updateErr.message}`;
      }
    }

    // Test 4: Full insert test
    let insertResult = "not attempted";
    if (userId) {
      try {
        const testEntry = await prisma.adminVerificationQueue.create({
          data: {
            userId,
            scoreId: 0,
            courseId: 0,
            ghinNumber: "00000000",
            screenshotUrl: null,
            status: "debug",
          },
        });
        await prisma.adminVerificationQueue.delete({
          where: { queueId: testEntry.queueId },
        });
        insertResult = "success";
      } catch (insertErr: any) {
        insertResult = `FAILED: ${insertErr.code || ""} ${insertErr.message}`;
      }
    }

    return NextResponse.json({
      sessionUserId: userId || "none",
      queueCount: count,
      userCheck,
      updateTest,
      insertResult,
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
