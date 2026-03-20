import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Accept both the env var key AND the hardcoded fallback
const ADMIN_KEYS: string[] = [
  process.env.ADMIN_API_KEY,
  "golfEQ-admin-2026-secure",
].filter(Boolean) as string[];

/**
 * Check admin auth via x-admin-key header OR session role.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export async function checkAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  // Check header key first — accept any valid admin key
  const headerKey = request.headers.get("x-admin-key");
  if (headerKey && ADMIN_KEYS.includes(headerKey)) {
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
