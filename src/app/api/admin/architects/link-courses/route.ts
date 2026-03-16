import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Get all architects
    const architects = await prisma.architect.findMany({
      select: { id: true, name: true },
    });

    // Get all courses with an originalArchitect but no architectId linked
    const courses = await prisma.course.findMany({
      where: {
        originalArchitect: { not: null },
        architectId: null,
      },
      select: { courseId: true, originalArchitect: true },
    });

    let linked = 0;
    const linkResults: { courseId: number; architect: string }[] = [];

    for (const course of courses) {
      if (!course.originalArchitect) continue;

      const archText = course.originalArchitect.toLowerCase().trim();

      // Try to find a matching architect
      const match = architects.find((a) => {
        const archName = a.name.toLowerCase();
        // Exact match
        if (archText === archName) return true;
        // Course text contains architect name
        if (archText.includes(archName)) return true;
        // Architect name contains course text
        if (archName.includes(archText)) return true;
        // Handle last name matching for single-word searches
        const lastName = archName.split(" ").pop() || "";
        if (archText === lastName) return true;
        // Handle "Coore/Crenshaw" or "Coore & Crenshaw" patterns
        if (archText.includes("/") || archText.includes("&")) {
          const parts = archText.split(/[\/&,]+/).map((p) => p.trim());
          return parts.some((p) => archName.toLowerCase().includes(p));
        }
        // Handle architect text like "Pete Dye/P.B. Dye" (slash-separated multiple)
        if (archText.includes(archName.split(" ")[0]?.toLowerCase() || "___")) {
          // First name match with same last name
          const archLast = archName.split(" ").pop()?.toLowerCase() || "";
          if (archText.includes(archLast)) return true;
        }
        return false;
      });

      if (match) {
        await prisma.course.update({
          where: { courseId: course.courseId },
          data: { architectId: match.id },
        });
        linked++;
        linkResults.push({ courseId: course.courseId, architect: match.name });
      }
    }

    return NextResponse.json({
      message: `Linked ${linked} courses to architects`,
      totalCoursesChecked: courses.length,
      linked,
      details: linkResults,
    });
  } catch (err) {
    console.error("Link courses error:", err);
    return NextResponse.json(
      { error: "Failed to link courses to architects" },
      { status: 500 }
    );
  }
}
