import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, any> = {};

  // Check env vars exist (don't expose values)
  checks.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? `Set (${process.env.GOOGLE_CLIENT_ID.slice(0, 20)}...)` : "MISSING";
  checks.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ? `Set (${process.env.GOOGLE_CLIENT_SECRET.slice(0, 8)}...)` : "MISSING";
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "MISSING";
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "Set" : "MISSING";
  checks.DATABASE_URL = process.env.DATABASE_URL ? "Set" : "MISSING";
  checks.NODE_ENV = process.env.NODE_ENV;

  // Test DB connectivity
  try {
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    checks.database = { connected: true, users: userCount, accounts: accountCount, sessions: sessionCount };
  } catch (e: any) {
    checks.database = { connected: false, error: e.message };
  }

  // Test creating a user (then delete)
  try {
    const testUser = await prisma.user.create({
      data: { email: `test-oauth-debug-${Date.now()}@test.com`, name: "Debug Test" },
    });
    await prisma.user.delete({ where: { id: testUser.id } });
    checks.dbWrite = "OK";
  } catch (e: any) {
    checks.dbWrite = `FAILED: ${e.message}`;
  }

  return NextResponse.json(checks, { status: 200 });
}
