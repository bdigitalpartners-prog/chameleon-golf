import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { primaryId, secondaryId } = await request.json();
    if (!primaryId || !secondaryId) {
      return NextResponse.json({ error: "primaryId and secondaryId are required" }, { status: 400 });
    }

    const [primary, secondary] = await Promise.all([
      prisma.architect.findUnique({ where: { id: primaryId } }),
      prisma.architect.findUnique({ where: { id: secondaryId } }),
    ]);

    if (!primary || !secondary) {
      return NextResponse.json({ error: "One or both architects not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Move courses from secondary to primary (update text field + FK)
      await tx.course.updateMany({
        where: { originalArchitect: secondary.name },
        data: { originalArchitect: primary.name, architectId: primary.id },
      });

      await tx.course.updateMany({
        where: { renovationArchitect: secondary.name },
        data: { renovationArchitect: primary.name },
      });

      // Transfer CourseArchitect links
      const secondaryCourseArchitects = await tx.courseArchitect.findMany({
        where: { architectId: secondaryId },
      });
      for (const ca of secondaryCourseArchitects) {
        const existing = await tx.courseArchitect.findUnique({
          where: { courseId_architectId_role: { courseId: ca.courseId, architectId: primaryId, role: ca.role } },
        });
        if (!existing) {
          await tx.courseArchitect.update({
            where: { id: ca.id },
            data: { architectId: primaryId },
          });
        } else {
          await tx.courseArchitect.delete({ where: { id: ca.id } });
        }
      }

      // Create alias for secondary's name
      const existingAlias = await tx.architectAlias.findUnique({
        where: { aliasName: secondary.name },
      });
      if (!existingAlias) {
        await tx.architectAlias.create({
          data: {
            architectId: primaryId,
            aliasName: secondary.name,
            aliasType: "alternate",
          },
        });
      }

      // Transfer missing data from secondary to primary
      const updates: Record<string, any> = {};
      if (!primary.bio && secondary.bio) updates.bio = secondary.bio;
      if (!primary.designPhilosophy && secondary.designPhilosophy) updates.designPhilosophy = secondary.designPhilosophy;
      if (!primary.imageUrl && secondary.imageUrl) updates.imageUrl = secondary.imageUrl;
      if (!primary.heroImageUrl && secondary.heroImageUrl) updates.heroImageUrl = secondary.heroImageUrl;
      if (!primary.portraitUrl && secondary.portraitUrl) updates.portraitUrl = secondary.portraitUrl;
      if (!primary.nationality && secondary.nationality) updates.nationality = secondary.nationality;
      if (!primary.era && secondary.era) updates.era = secondary.era;
      if (!primary.websiteUrl && secondary.websiteUrl) updates.websiteUrl = secondary.websiteUrl;
      if (!primary.firmName && secondary.firmName) updates.firmName = secondary.firmName;
      if (primary.notableFeatures.length === 0 && secondary.notableFeatures.length > 0) {
        updates.notableFeatures = secondary.notableFeatures;
      }
      if (primary.signatureCourses.length === 0 && secondary.signatureCourses.length > 0) {
        updates.signatureCourses = secondary.signatureCourses;
      }

      if (Object.keys(updates).length > 0) {
        await tx.architect.update({ where: { id: primaryId }, data: updates });
      }

      // Delete secondary architect (cascades aliases, media, etc.)
      await tx.architect.delete({ where: { id: secondaryId } });
    });

    const merged = await prisma.architect.findUnique({
      where: { id: primaryId },
      include: { aliases: true },
    });

    return NextResponse.json(merged);
  } catch (err) {
    console.error("Architect merge error:", err);
    return NextResponse.json({ error: "Failed to merge architects" }, { status: 500 });
  }
}
