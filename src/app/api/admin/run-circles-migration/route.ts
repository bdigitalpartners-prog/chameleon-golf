import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Only allow with admin API key
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if tables already exist
    const existing = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'messages', 'conversation_participants')
      ORDER BY table_name;
    `;

    if (existing.length === 3) {
      return NextResponse.json({
        message: "Migration already applied — all 3 tables exist",
        tables: existing.map((t) => t.table_name),
      });
    }

    // Check if enum exists
    const enumExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConversationType') as exists;
    `;

    if (!enumExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'CIRCLE', 'COURSE');`);
    }

    // Create conversations table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" TEXT NOT NULL,
        "type" "ConversationType" NOT NULL DEFAULT 'DIRECT',
        "title" VARCHAR(255),
        "circle_id" TEXT,
        "course_id" INTEGER,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create conversation_participants table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "conversation_participants" (
        "id" TEXT NOT NULL,
        "conversation_id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "muted" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create messages table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" TEXT NOT NULL,
        "conversation_id" TEXT NOT NULL,
        "sender_id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "video_url" VARCHAR(500),
        "video_title" VARCHAR(255),
        "reply_to_id" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "conversations_circle_id_idx" ON "conversations"("circle_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "conversations_course_id_idx" ON "conversations"("course_id");`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages"("sender_id");`);

    // Add foreign keys (use DO block to handle if they already exist)
    const fkeys = [
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;`,
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    ];

    const fkResults: string[] = [];
    for (const fk of fkeys) {
      try {
        await prisma.$executeRawUnsafe(fk);
        fkResults.push("created");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("already exists")) {
          fkResults.push("already exists");
        } else {
          fkResults.push(`error: ${msg}`);
        }
      }
    }

    // Verify
    const verification = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'messages', 'conversation_participants')
      ORDER BY table_name;
    `;

    return NextResponse.json({
      success: true,
      message: "Circles messaging migration applied successfully",
      tables_created: verification.map((t) => t.table_name),
      foreign_keys: fkResults,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Migration error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
