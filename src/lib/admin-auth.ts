import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * Check admin auth via x-admin-key header OR session role.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export async function checkAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  // Check header key first
  const headerKey = request.headers.get("x-admin-key");
  if (ADMIN_API_KEY && headerKey === ADMIN_API_KEY) {
    return null;
  }

  // Fall back to session check
  const session = await getServerSession(authOptions);
  if (session && (session.user as any)?.role === "admin") {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
