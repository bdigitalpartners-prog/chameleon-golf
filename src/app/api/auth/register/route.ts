import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createHubSpotContact(
  email: string,
  firstname: string,
  lastname: string
): Promise<void> {
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
          firstname,
          lastname,
          company: "golfEQUALIZER Early Access",
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
    const body = await req.json();
    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Ensure the auth_users table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "auth_users" (
        "id" TEXT PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" TEXT NOT NULL,
        "first_name" VARCHAR(255) NOT NULL,
        "last_name" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if user already exists
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "auth_users" WHERE email = $1`,
      trimmedEmail
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate a unique ID
    const id = crypto.randomUUID();

    // Insert user
    await prisma.$executeRawUnsafe(
      `INSERT INTO "auth_users" (id, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5)`,
      id,
      trimmedEmail,
      passwordHash,
      firstName.trim(),
      lastName.trim()
    );

    // Create HubSpot contact (non-blocking)
    createHubSpotContact(trimmedEmail, firstName.trim(), lastName.trim()).catch(
      (err) => console.error("Background HubSpot sync failed:", err)
    );

    return NextResponse.json(
      { success: true, message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
