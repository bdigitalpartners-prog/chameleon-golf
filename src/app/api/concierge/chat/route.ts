import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseQuery, buildWhereClause, generateResponse } from "@/lib/concierge-parser";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    message: string;
    sessionId?: string;
    conversationId?: number | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { message, sessionId = "anonymous" } = body;
  let { conversationId } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    // Create or get conversation
    if (!conversationId) {
      const conv = await prisma.$queryRawUnsafe<{ id: number }[]>(
        `INSERT INTO concierge_conversations (session_id, created_at) VALUES ($1, NOW()) RETURNING id`,
        sessionId
      );
      conversationId = conv[0]?.id;
    }

    // Save user message
    if (conversationId) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO concierge_messages (conversation_id, role, content, created_at) VALUES ($1, 'user', $2, NOW())`,
        conversationId,
        message
      );
    }

    // Parse the query to extract filters
    const filters = parseQuery(message);
    const { where, params } = buildWhereClause(filters);
    const limit = filters.limit || 12;

    // Query courses based on extracted filters
    const courses = await prisma.$queryRawUnsafe<any[]>(
      `SELECT c."courseId", c."courseName", c."city", c."state", c."country",
              c."courseStyle", c."accessType", c."greenFeeLow", c."greenFeeHigh",
              c."originalArchitect", c."walkingPolicy", c."latitude", c."longitude",
              c."numHoles", c."par", c."yearOpened", c."logoUrl"
       FROM courses c
       WHERE ${where}
       ORDER BY c."greenFeeLow" ASC NULLS LAST
       LIMIT ${limit}`,
      ...params
    );

    // Generate conversational response
    const { message: responseMessage, suggestions } = generateResponse(courses, filters, message);

    // Format course cards
    const courseCards = courses.map((c: any) => ({
      courseId: c.courseId,
      name: c.courseName,
      location: [c.city, c.state, c.country].filter(Boolean).join(", "),
      style: c.courseStyle || "Unknown",
      accessType: c.accessType || "Unknown",
      greenFee: c.greenFeeLow
        ? c.greenFeeHigh && c.greenFeeHigh !== c.greenFeeLow
          ? `$${c.greenFeeLow}–$${c.greenFeeHigh}`
          : `$${c.greenFeeLow}`
        : "N/A",
      architect: c.originalArchitect || "Unknown",
      walkable: c.walkingPolicy
        ? !c.walkingPolicy.toLowerCase().includes("not allowed")
        : null,
      logoUrl: c.logoUrl,
      numHoles: c.numHoles,
      par: c.par,
    }));

    // Save assistant response
    const metadata = JSON.stringify({
      filters_applied: filters,
      course_count: courses.length,
      course_ids: courses.map((c: any) => c.courseId),
    });

    if (conversationId) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO concierge_messages (conversation_id, role, content, metadata, created_at) VALUES ($1, 'assistant', $2, $3, NOW())`,
        conversationId,
        responseMessage,
        metadata
      );
    }

    return NextResponse.json({
      message: responseMessage,
      courses: courseCards,
      filters_applied: filters,
      suggestions,
      conversationId,
    });
  } catch (err) {
    console.error("Concierge chat error:", err);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
