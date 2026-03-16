import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Database check
    let dbStatus = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = true;
    } catch {
      dbStatus = false;
    }

    const checks = {
      database: { name: "Database", status: dbStatus, detail: dbStatus ? "Connected" : "Disconnected" },
      perplexity: { name: "Perplexity API", status: !!process.env.PERPLEXITY_API_KEY, detail: process.env.PERPLEXITY_API_KEY ? "Configured" : "Not configured" },
      adminKey: { name: "ADMIN_API_KEY", status: !!process.env.ADMIN_API_KEY, detail: process.env.ADMIN_API_KEY ? "Configured" : "Not configured" },
      nextAuth: { name: "NextAuth", status: !!process.env.NEXTAUTH_SECRET, detail: process.env.NEXTAUTH_SECRET ? "Configured" : "Not configured" },
      resend: { name: "Resend Email", status: !!process.env.RESEND_API_KEY, detail: process.env.RESEND_API_KEY ? "Configured" : "Not configured" },
      posthog: { name: "PostHog", status: !!(process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_API_KEY), detail: (process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_API_KEY) ? "Configured" : "Not configured" },
      sentry: { name: "Sentry", status: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN), detail: (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) ? "Configured" : "Not configured" },
    };

    return NextResponse.json({
      checks,
      environment: process.env.NODE_ENV || "unknown",
      nodeVersion: process.version,
    });
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json({ error: "Failed to run health checks" }, { status: 500 });
  }
}
