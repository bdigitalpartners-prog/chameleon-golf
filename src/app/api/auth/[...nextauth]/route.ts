import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const nextAuthHandler = NextAuth(authOptions);

async function wrappedHandler(req: NextRequest, context: any) {
  try {
    const url = new URL(req.url);
    
    // Log callback requests for debugging
    if (url.pathname.includes("/callback/")) {
      console.log("[OAuth Debug] Callback hit:", {
        pathname: url.pathname,
        searchParams: Object.fromEntries(url.searchParams),
        hasCode: url.searchParams.has("code"),
        hasError: url.searchParams.has("error"),
        hasState: url.searchParams.has("state"),
        cookies: req.headers.get("cookie")?.split(";").map(c => c.trim().split("=")[0]),
      });
    }

    return await nextAuthHandler(req, context);
  } catch (error: any) {
    console.error("[OAuth Debug] Handler error:", {
      message: error.message,
      stack: error.stack?.slice(0, 500),
      name: error.name,
    });
    
    // Return a visible error page instead of silently redirecting
    return NextResponse.json({
      error: "OAuth handler error",
      message: error.message,
      name: error.name,
    }, { status: 500 });
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
