import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/\bgolf\s*(course|club|links|resort)\b/gi, "")
    .replace(/\b(the|at|of|and|&)\b/gi, "")
    .replace(/\bcountry\s*club\b/gi, "cc")
    .replace(/\bcc\b/gi, "cc")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

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
    .split(/[\s&:,\-]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t && !["the", "at", "of", "and", "a"].includes(t));
}

function tokenOverlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  const intersection = b.filter((t) => setA.has(t));
  const union = new Set([...a, ...b]);
  return union.size > 0 ? intersection.length / union.size : 0;
}

interface CourseSummary {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  accessType: string | null;
  isEnriched: boolean;
  numListsAppeared: number | null;
}

interface DuplicatePair {
  courseA: CourseSummary;
  courseB: CourseSummary;
  score: number;
  reasons: string[];
}

export async function GET(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  try {
    const courses = await prisma.course.findMany({
      select: {
        courseId: true,
        courseName: true,
        facilityName: true,
        city: true,
        state: true,
        accessType: true,
        isEnriched: true,
        numListsAppeared: true,
      },
      orderBy: { courseName: "asc" },
    });

    const pairs: DuplicatePair[] = [];

    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const a = courses[i];
        const b = courses[j];

        const normA = normalize(a.courseName);
        const normB = normalize(b.courseName);

        // Quick skip: if normalized names are very different in length, skip
        if (Math.abs(normA.length - normB.length) > 8) continue;

        let score = 0;
        const reasons: string[] = [];

        // Exact normalized match (very high confidence)
        if (normA === normB) {
          score += 80;
          reasons.push("Exact normalized name match");
        } else {
          // Levenshtein on normalized names
          const dist = levenshtein(normA, normB);
          const maxLen = Math.max(normA.length, normB.length);
          const similarity = maxLen > 0 ? 1 - dist / maxLen : 0;

          if (similarity > 0.85) {
            score += similarity * 60;
            reasons.push(`Name similarity: ${(similarity * 100).toFixed(0)}%`);
          } else if (similarity > 0.7) {
            score += similarity * 40;
            reasons.push(`Name similarity: ${(similarity * 100).toFixed(0)}%`);
          }
        }

        // Token overlap on original names
        const tokensA = tokenize(a.courseName);
        const tokensB = tokenize(b.courseName);
        const overlap = tokenOverlap(tokensA, tokensB);

        if (overlap > 0.6) {
          score += overlap * 20;
          reasons.push(`Token overlap: ${(overlap * 100).toFixed(0)}%`);
        }

        // Same state boost
        if (a.state && b.state && a.state === b.state) {
          if (score > 15) {
            score += 10;
            reasons.push("Same state");
          }
        }

        // Same city boost
        if (a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase()) {
          if (score > 15) {
            score += 10;
            reasons.push("Same city");
          }
        }

        // One name contains the other (common with "Resort: Course" patterns)
        const lowerA = a.courseName.toLowerCase();
        const lowerB = b.courseName.toLowerCase();
        if (
          (lowerA.includes(lowerB) || lowerB.includes(lowerA)) &&
          Math.min(lowerA.length, lowerB.length) > 8
        ) {
          score += 15;
          reasons.push("Name containment");
        }

        if (score > 30) {
          pairs.push({
            courseA: a,
            courseB: b,
            score: Math.round(score),
            reasons,
          });
        }
      }
    }

    pairs.sort((a, b) => b.score - a.score);

    return NextResponse.json({ pairs: pairs.slice(0, 100), totalCourses: courses.length });
  } catch (err) {
    console.error("Course duplicate detection error:", err);
    return NextResponse.json({ error: "Failed to detect duplicates" }, { status: 500 });
  }
}
