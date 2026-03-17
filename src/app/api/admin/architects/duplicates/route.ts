import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= an; i++) matrix[i] = [i];
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[an][bn];
}

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[\s&]+/)
    .map((t) => t.replace(/[^a-z]/g, ""))
    .filter((t) => t && t !== "and");
}

function tokenOverlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  const intersection = b.filter((t) => setA.has(t));
  return intersection.length / Math.max(a.length, b.length);
}

interface DuplicatePair {
  architectA: { id: number; name: string; nationality: string | null; era: string | null };
  architectB: { id: number; name: string; nationality: string | null; era: string | null };
  score: number;
  reason: string;
}

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const architects = await prisma.architect.findMany({
      select: { id: true, name: true, nationality: true, era: true },
      orderBy: { name: "asc" },
    });

    const pairs: DuplicatePair[] = [];

    for (let i = 0; i < architects.length; i++) {
      for (let j = i + 1; j < architects.length; j++) {
        const a = architects[i];
        const b = architects[j];

        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const dist = levenshtein(nameA, nameB);
        const maxLen = Math.max(nameA.length, nameB.length);
        const nameSimilarity = 1 - dist / maxLen;

        const tokensA = tokenize(a.name);
        const tokensB = tokenize(b.name);
        const overlap = tokenOverlap(tokensA, tokensB);

        let score = 0;
        const reasons: string[] = [];

        // High name similarity
        if (nameSimilarity > 0.8) {
          score += nameSimilarity * 60;
          reasons.push(`Name similarity: ${(nameSimilarity * 100).toFixed(0)}%`);
        }

        // Token overlap
        if (overlap > 0.5) {
          score += overlap * 30;
          reasons.push(`Token overlap: ${(overlap * 100).toFixed(0)}%`);
        }

        // Same nationality + era boost
        if (a.nationality && b.nationality && a.nationality === b.nationality) {
          if (a.era && b.era && a.era === b.era) {
            if (nameSimilarity > 0.5 || overlap > 0.3) {
              score += 15;
              reasons.push("Same nationality & era");
            }
          }
        }

        if (score > 30) {
          pairs.push({
            architectA: a,
            architectB: b,
            score: Math.round(score),
            reason: reasons.join("; "),
          });
        }
      }
    }

    pairs.sort((a, b) => b.score - a.score);

    return NextResponse.json(pairs.slice(0, 50));
  } catch (err) {
    console.error("Duplicate detection error:", err);
    return NextResponse.json({ error: "Failed to detect duplicates" }, { status: 500 });
  }
}
