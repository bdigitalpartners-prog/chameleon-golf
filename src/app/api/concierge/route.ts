import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

// Cost per model (per token)
const MODEL_COSTS: Record<string, { input: number; output: number; requestFee: number }> = {
  "sonar": { input: 1 / 1_000_000, output: 1 / 1_000_000, requestFee: 0.005 },
  "sonar-pro": { input: 3 / 1_000_000, output: 15 / 1_000_000, requestFee: 0.006 },
  "sonar-reasoning-pro": { input: 2 / 1_000_000, output: 8 / 1_000_000, requestFee: 0.006 },
};

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

const DEFAULT_SYSTEM_PROMPT = `You are the GolfEQ Concierge, an AI-powered golf course expert for the CourseFACTOR ranking platform. You have deep knowledge of over 1,500 ranked golf courses worldwide.

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

async function getAdminConfig(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ key: string; value: string }>>`
      SELECT key, value FROM admin_config
    `;
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return config;
  } catch {
    // Table may not exist yet — return empty config (use defaults)
    return {};
  }
}

async function getTodaySpend(): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<Array<{ total: number | null }>>`
      SELECT COALESCE(SUM("total_cost"), 0) as total
      FROM concierge_usage
      WHERE "created_at" >= CURRENT_DATE
    `;
    return Number(rows[0]?.total ?? 0);
  } catch {
    return 0;
  }
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

  // Read admin config for model, budget, and system prompt
  const config = await getAdminConfig();
  let activeModel = config.concierge_active_model || "sonar-pro";
  const dailyBudgetCap = parseFloat(config.concierge_daily_budget_cap || "0");
  const fallbackModel = config.concierge_fallback_model || "sonar";
  const autoDowngrade = config.concierge_auto_downgrade === "true";
  const customPrompt = config.concierge_system_prompt || null;

  // Check budget cap before proceeding
  if (dailyBudgetCap > 0) {
    const todaySpend = await getTodaySpend();
    if (todaySpend >= dailyBudgetCap) {
      if (autoDowngrade && activeModel !== fallbackModel) {
        activeModel = fallbackModel;
      } else if (!autoDowngrade) {
        return NextResponse.json(
          { error: "Daily concierge budget has been reached. Please try again tomorrow." },
          { status: 429 }
        );
      }
    }
  }

  // Validate model
  if (!MODEL_COSTS[activeModel]) {
    activeModel = "sonar-pro";
  }

  const costs = MODEL_COSTS[activeModel];
  const systemPrompt = customPrompt || DEFAULT_SYSTEM_PROMPT;

  const messages = [
    { role: "system", content: systemPrompt },
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
        model: activeModel,
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
    const usedModel = activeModel;

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
            inputTokens * costs.input +
            outputTokens * costs.output;
          const totalCost = estimatedCost + costs.requestFee;

          try {
            await prisma.conciergeUsage.create({
              data: {
                sessionId,
                userIp: ip,
                inputTokens,
                outputTokens,
                estimatedCost,
                requestFee: costs.requestFee,
                totalCost,
                model: usedModel,
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
