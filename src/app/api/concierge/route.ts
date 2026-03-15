import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

// Sonar Pro pricing
const INPUT_COST_PER_TOKEN = 3 / 1_000_000; // $3 per 1M input tokens
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000; // $15 per 1M output tokens
const REQUEST_FEE = 0.006; // $6 per 1K requests = $0.006 per request

// Simple in-memory rate limiter: 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Periodically clean up stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000);

const SYSTEM_PROMPT = `You are the GolfEQ Concierge, an AI-powered golf course expert for the CourseFACTOR ranking platform. You have deep knowledge of over 1,500 ranked golf courses worldwide.

Your expertise includes:
- CourseFACTOR rankings, which aggregate data from Golf Digest, Golfweek, GOLF Magazine, and Top100GolfCourses
- Green fees, tee times, and pricing details
- Course architects (original and renovation), design philosophy, and course history
- Golf trip planning: itineraries, best times to visit, nearby courses to combine
- Course comparisons: helping golfers choose between similar courses
- Lodging recommendations near golf courses, including on-site resorts and stay-and-play packages
- Dining recommendations near courses
- Nearby airports and travel logistics
- Course conditions, walking policies, caddie availability, and dress codes
- Championship history and famous moments at courses

Personality: You are knowledgeable, warm, and enthusiastic — like a well-connected golf insider who genuinely loves helping people discover great courses. You speak with authority but remain approachable. You occasionally reference CourseFACTOR data and rankings naturally in conversation.

Guidelines:
- When discussing specific courses, suggest the user explore that course's page on CourseFACTOR/GolfEQ for detailed rankings, photos, and reviews
- Provide specific, actionable advice rather than generic tips
- When comparing courses, reference their CourseFACTOR scores and what makes each unique
- For trip planning, consider logistics like airports, drive times, and course proximity
- Keep responses conversational but informative — aim for helpful depth without overwhelming
- If you don't know something specific, say so honestly rather than guessing
- Use the CourseFACTOR scoring system which rates courses on: Conditioning, Layout/Design, Pace of Play, Aesthetics, Challenge, Value, Amenities, Walkability, and Service`;

// Rough token estimation: ~4 chars per token for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function POST(request: NextRequest) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: "Concierge service is not configured" },
      { status: 503 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  let body: { message: string; conversationHistory?: Array<{ role: string; content: string }>; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { message, conversationHistory = [], sessionId = "anonymous" } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-20), // Keep last 20 messages for context
    { role: "user", content: message },
  ];

  // Estimate input tokens
  const inputText = messages.map((m) => m.content).join(" ");
  const inputTokens = estimateTokens(inputText);

  try {
    const response = await fetch(PERPLEXITY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to get response from AI service" },
        { status: response.status }
      );
    }

    let outputText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  outputText += content;
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed SSE chunks
              }
            }
          }
        } catch (err) {
          console.error("Stream reading error:", err);
        } finally {
          // Log usage after stream completes
          const outputTokens = estimateTokens(outputText);
          const estimatedCost =
            inputTokens * INPUT_COST_PER_TOKEN +
            outputTokens * OUTPUT_COST_PER_TOKEN;
          const totalCost = estimatedCost + REQUEST_FEE;

          try {
            await prisma.conciergeUsage.create({
              data: {
                sessionId,
                userIp: ip,
                inputTokens,
                outputTokens,
                estimatedCost,
                requestFee: REQUEST_FEE,
                totalCost,
                model: "sonar-pro",
                messagePreview: message.slice(0, 200),
              },
            });
          } catch (logErr) {
            console.error("Failed to log concierge usage:", logErr);
          }

          controller.enqueue(
            new TextEncoder().encode("data: [DONE]\n\n")
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Concierge API error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
