import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * Check admin authorization via x-admin-key header OR session role.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export async function checkAdminAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const adminKey = request.headers.get("x-admin-key");
  if (ADMIN_API_KEY && adminKey === ADMIN_API_KEY) {
    return null;
  }

  const session = await getServerSession(authOptions);
  if (session && (session.user as any)?.role === "admin") {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Check admin authorization for GET-only routes (no request object needed for session check).
 */
export async function checkAdminAuthSession(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (session && (session.user as any)?.role === "admin") {
    return null;
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
