import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Primary: use ADMIN_API_KEY env var. Fallback: hardcoded key for when env var isn't set.
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "golfEQ-admin-2026-secure";

/**
 * Check admin auth via x-admin-key header OR session role.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export async function checkAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  // Check header key first
  const headerKey = request.headers.get("x-admin-key");
  if (headerKey && headerKey === ADMIN_API_KEY) {
    return null;
  }

  // Fall back to session check
  try {
    const session = await getServerSession(authOptions);
    if (session && (session.user as any)?.role === "admin") {
      return null;
    }
  } catch {
    // Session check failed — continue to deny
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
