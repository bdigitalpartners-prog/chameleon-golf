import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

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

async function createHubSpotContact(email: string): Promise<void> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    console.log("HUBSPOT_ACCESS_TOKEN not configured, skipping HubSpot sync");
    return;
  }

  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          email,
          lifecyclestage: "subscriber",
          hs_lead_status: "NEW",
          notes_last_contacted: "golfEQUALIZER Early Access Signup",
        },
      }),
    });

    if (res.status === 409) {
      console.log(`HubSpot: contact already exists for ${email}`);
      return;
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`HubSpot API error (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error("HubSpot API request failed:", err);
  }
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
    const { email, name, handicap, source } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Ensure the waitlist_signups table exists (handles case where prisma db push hasn't been run)
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "waitlist_signups" (
          "id" SERIAL PRIMARY KEY,
          "email" VARCHAR(255) NOT NULL UNIQUE,
          "name" VARCHAR(255),
          "handicap" VARCHAR(50),
          "source" VARCHAR(100),
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      // Table likely already exists, continue
    }

    // Check if already signed up
    const existing = await prisma.waitlistSignup.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      // Return success without creating duplicate
      const position = await prisma.waitlistSignup.count({
        where: { createdAt: { lte: existing.createdAt } },
      });
      return NextResponse.json({
        success: true,
        message: "You're on the list! We'll be in touch soon.",
        position,
        alreadySignedUp: true,
      });
    }

    // Create new signup
    const signup = await prisma.waitlistSignup.create({
      data: {
        email: trimmedEmail,
        name: name?.trim() || null,
        handicap: handicap || null,
        source: source || null,
      },
    });

    const position = await prisma.waitlistSignup.count();

    // Create contact in HubSpot (non-blocking — don't fail the request if this errors)
    createHubSpotContact(trimmedEmail).catch((err) =>
      console.error("Background HubSpot sync failed:", err)
    );

    return NextResponse.json(
      {
        success: true,
        message: "You're on the list! We'll be in touch soon.",
        position,
        alreadySignedUp: false,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/waitlist error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const count = await prisma.waitlistSignup.count();
    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("GET /api/waitlist error:", error);
    return NextResponse.json({ count: 0 });
  }
}
