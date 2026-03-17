import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
  }
  return _openai;
}

export interface CourseContext {
  courseId: number;
  courseName: string;
  facilityName?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  courseStyle?: string | null;
  accessType?: string | null;
  courseType?: string | null;
  par?: number | null;
  numHoles?: number | null;
  yearOpened?: number | null;
  originalArchitect?: string | null;
  renovationArchitect?: string | null;
  renovationYear?: number | null;
  designPhilosophy?: string | null;
  description?: string | null;
  whatToExpect?: string | null;
  courseStrategy?: string | null;
  greenFeeLow?: string | null;
  greenFeeHigh?: string | null;
  walkingPolicy?: string | null;
  caddieAvailability?: string | null;
  fairwayGrass?: string | null;
  greenGrass?: string | null;
  greenSpeed?: string | null;
  signatureHoleNumber?: number | null;
  signatureHoleDescription?: string | null;
  bestTimeToPlay?: string | null;
  tagline?: string | null;
  // Rankings context
  rankings?: Array<{
    listName: string;
    sourceName: string;
    rankPosition: number | null;
  }>;
  // Architect context
  architectName?: string | null;
  architectBio?: string | null;
}

export interface GeneratedContent {
  richDescription: string;
  whatToExpect: string;
  strategyLowHcp: string;
  strategyMidHcp: string;
  strategyHighHcp: string;
  threeThingsToKnow: string[];
  firstTimerGuide: string;
}

function buildCourseFactSheet(ctx: CourseContext): string {
  const facts: string[] = [];
  facts.push(`Course: ${ctx.courseName}`);
  if (ctx.facilityName && ctx.facilityName !== ctx.courseName) facts.push(`Facility: ${ctx.facilityName}`);
  if (ctx.city || ctx.state) facts.push(`Location: ${[ctx.city, ctx.state, ctx.country].filter(Boolean).join(", ")}`);
  if (ctx.courseStyle) facts.push(`Style: ${ctx.courseStyle}`);
  if (ctx.accessType) facts.push(`Access: ${ctx.accessType}`);
  if (ctx.courseType) facts.push(`Type: ${ctx.courseType}`);
  if (ctx.par) facts.push(`Par: ${ctx.par}`);
  if (ctx.numHoles) facts.push(`Holes: ${ctx.numHoles}`);
  if (ctx.yearOpened) facts.push(`Year Opened: ${ctx.yearOpened}`);
  if (ctx.originalArchitect) facts.push(`Original Architect: ${ctx.originalArchitect}`);
  if (ctx.renovationArchitect) facts.push(`Renovation Architect: ${ctx.renovationArchitect}${ctx.renovationYear ? ` (${ctx.renovationYear})` : ""}`);
  if (ctx.designPhilosophy) facts.push(`Design Philosophy: ${ctx.designPhilosophy}`);
  if (ctx.description) facts.push(`Existing Description: ${ctx.description}`);
  if (ctx.greenFeeLow || ctx.greenFeeHigh) facts.push(`Green Fees: $${ctx.greenFeeLow || "?"}–$${ctx.greenFeeHigh || "?"}`);
  if (ctx.walkingPolicy) facts.push(`Walking Policy: ${ctx.walkingPolicy}`);
  if (ctx.caddieAvailability) facts.push(`Caddie: ${ctx.caddieAvailability}`);
  if (ctx.fairwayGrass) facts.push(`Fairways: ${ctx.fairwayGrass}`);
  if (ctx.greenGrass) facts.push(`Greens: ${ctx.greenGrass}`);
  if (ctx.greenSpeed) facts.push(`Green Speed: ${ctx.greenSpeed}`);
  if (ctx.signatureHoleNumber) facts.push(`Signature Hole: #${ctx.signatureHoleNumber}${ctx.signatureHoleDescription ? ` — ${ctx.signatureHoleDescription}` : ""}`);
  if (ctx.bestTimeToPlay) facts.push(`Best Time: ${ctx.bestTimeToPlay}`);
  if (ctx.tagline) facts.push(`Tagline: ${ctx.tagline}`);
  if (ctx.architectName) facts.push(`Architect: ${ctx.architectName}`);
  if (ctx.architectBio) facts.push(`Architect Bio: ${ctx.architectBio.substring(0, 300)}`);
  if (ctx.rankings && ctx.rankings.length > 0) {
    const rankStrs = ctx.rankings
      .slice(0, 5)
      .map((r) => `#${r.rankPosition} on ${r.sourceName} ${r.listName}`)
      .join("; ");
    facts.push(`Rankings: ${rankStrs}`);
  }
  return facts.join("\n");
}

const SYSTEM_PROMPT = `You are an elite golf course writer for a premium golf media platform. Your writing style blends the authoritative voice of Golf Digest features with the insider knowledge of a well-traveled club professional. Write with specificity, warmth, and expertise — never generic filler. Every piece should feel like it was written by someone who has walked the course.

Rules:
- Return ONLY valid JSON matching the exact schema requested
- No markdown, no explanation, no code blocks — just the JSON object
- Use the course facts provided to write rich, specific content
- If key facts are missing, write in a way that is still engaging without making up specifics
- Each content piece should stand on its own and not repeat information verbatim from other sections
- Use evocative, sensory language — sights, sounds, textures, feelings
- Be authoritative but approachable`;

function buildGenerationPrompt(ctx: CourseContext): string {
  const facts = buildCourseFactSheet(ctx);

  return `Here are the known facts about this golf course:

${facts}

Generate the following content for this course, returning a single JSON object:

{
  "richDescription": "A rich, evocative description (200-400 words) covering the course's character, setting, design philosophy, and what makes it special. Write in an authoritative golf media tone (think Golf Digest feature). If the course is historically significant or highly ranked, lead with that. Weave in the architect's vision, the landscape, and what distinguishes this course from others.",

  "whatToExpect": "A first-person practical guide (150-250 words) for someone about to play. Cover the arrival experience, standout holes, pace, conditions, and memorable moments. Write as if briefing a friend who scored a tee time.",

  "strategyLowHcp": "Technical strategy tips for low handicap golfers (0-10). Be specific about course management: when to be aggressive, where trouble lurks, how to attack pins. 100-180 words.",

  "strategyMidHcp": "Course management approach for mid handicap golfers (11-20). Focus on smart play: where to aim, which par 5s are reachable, how to avoid big numbers. 100-180 words.",

  "strategyHighHcp": "A survival guide / enjoyment tips for high handicap golfers (21+). Focus on having fun, where to bail out safely, which holes to take your medicine on, and where the best views are. Encouraging tone. 100-180 words.",

  "threeThingsToKnow": ["Thing 1 — a short, punchy fact or tip (1-2 sentences)", "Thing 2 — another key thing to know", "Thing 3 — the third most important/interesting fact"],

  "firstTimerGuide": "What first-time visitors need to know (100-200 words). Cover arrival logistics, pro shop, locker room, practice facilities, any unique traditions or customs at this club, and how to make the most of the experience."
}`;
}

function parseGeneratedContent(raw: string): GeneratedContent {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in AI response");

  const parsed = JSON.parse(match[0]);

  if (!parsed.richDescription || !parsed.whatToExpect) {
    throw new Error("AI response missing required fields");
  }

  return {
    richDescription: String(parsed.richDescription || ""),
    whatToExpect: String(parsed.whatToExpect || ""),
    strategyLowHcp: String(parsed.strategyLowHcp || ""),
    strategyMidHcp: String(parsed.strategyMidHcp || ""),
    strategyHighHcp: String(parsed.strategyHighHcp || ""),
    threeThingsToKnow: Array.isArray(parsed.threeThingsToKnow)
      ? parsed.threeThingsToKnow.map(String).slice(0, 3)
      : [],
    firstTimerGuide: String(parsed.firstTimerGuide || ""),
  };
}

export async function generateCourseContent(
  ctx: CourseContext,
  model: string = "gpt-4o"
): Promise<GeneratedContent> {
  const prompt = buildGenerationPrompt(ctx);

  const response = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" },
  });

  const rawContent = response.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error("Empty response from OpenAI");

  return parseGeneratedContent(rawContent);
}

/**
 * Rate-limited batch generation: max `concurrency` at a time with delay between batches.
 */
export async function generateBatch(
  courses: CourseContext[],
  options: {
    model?: string;
    concurrency?: number;
    delayMs?: number;
    onProgress?: (done: number, total: number, current: string) => void;
  } = {}
): Promise<Array<{ courseId: number; content?: GeneratedContent; error?: string }>> {
  const { model = "gpt-4o", concurrency = 5, delayMs = 1000, onProgress } = options;
  const results: Array<{ courseId: number; content?: GeneratedContent; error?: string }> = [];

  for (let i = 0; i < courses.length; i += concurrency) {
    const batch = courses.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (ctx) => {
        const content = await generateCourseContent(ctx, model);
        return { courseId: ctx.courseId, content };
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        const failedCtx = batch[batchResults.indexOf(result)];
        results.push({
          courseId: failedCtx?.courseId ?? 0,
          error: result.reason?.message || "Unknown error",
        });
      }
    }

    const done = Math.min(i + concurrency, courses.length);
    onProgress?.(done, courses.length, batch[batch.length - 1]?.courseName || "");

    if (i + concurrency < courses.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}
