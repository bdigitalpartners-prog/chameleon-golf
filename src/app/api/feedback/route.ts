import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      email,
      handicapIndex,
      homeCourse,
      howFound,
      contentIdeas,
      contentChecklist,
      toolIdeas,
      toolChecklist,
      courseIntelligence,
      courseIntelChecklist,
      generalFeedback,
      interestLevel,
    } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Ensure table exists
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "founding_advisory_feedback" (
          "id" SERIAL PRIMARY KEY,
          "full_name" VARCHAR(255) NOT NULL,
          "email" VARCHAR(255) NOT NULL,
          "handicap_index" VARCHAR(20),
          "home_course" VARCHAR(255),
          "how_found" VARCHAR(100),
          "content_ideas" TEXT,
          "content_checklist" TEXT,
          "tool_ideas" TEXT,
          "tool_checklist" TEXT,
          "course_intelligence" TEXT,
          "course_intel_checklist" TEXT,
          "general_feedback" TEXT,
          "interest_level" VARCHAR(50),
          "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch {
      // Table likely already exists
    }

    await prisma.foundingAdvisoryFeedback.create({
      data: {
        fullName: fullName.trim(),
        email: trimmedEmail,
        handicapIndex: handicapIndex?.trim() || null,
        homeCourse: homeCourse?.trim() || null,
        howFound: howFound || null,
        contentIdeas: contentIdeas?.trim() || null,
        contentChecklist: contentChecklist || null,
        toolIdeas: toolIdeas?.trim() || null,
        toolChecklist: toolChecklist || null,
        courseIntelligence: courseIntelligence?.trim() || null,
        courseIntelChecklist: courseIntelChecklist || null,
        generalFeedback: generalFeedback?.trim() || null,
        interestLevel: interestLevel || null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Thank you for your feedback!" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/feedback error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
