import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_TAGS = 5;

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { tagIds } = await req.json();

    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ error: "tagIds must be an array" }, { status: 400 });
    }

    if (tagIds.length > MAX_TAGS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TAGS} tags allowed` },
        { status: 400 }
      );
    }

    // Ensure the profile exists
    await prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Verify all tags exist
    const validTags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    if (validTags.length !== tagIds.length) {
      return NextResponse.json({ error: "One or more invalid tag IDs" }, { status: 400 });
    }

    // Remove existing tags and set new ones in a transaction
    await prisma.$transaction(async (tx) => {
      // Get old tags for decrementing usage
      const oldTags = await tx.userTag.findMany({
        where: { userId },
        select: { tagId: true },
      });

      // Delete old user tags
      await tx.userTag.deleteMany({ where: { userId } });

      // Decrement usage count for removed tags
      if (oldTags.length > 0) {
        await tx.tag.updateMany({
          where: { id: { in: oldTags.map((t) => t.tagId) } },
          data: { usageCount: { decrement: 1 } },
        });
      }

      // Create new user tags
      if (tagIds.length > 0) {
        await tx.userTag.createMany({
          data: tagIds.map((tagId: string) => ({ userId, tagId })),
        });

        // Increment usage count for new tags
        await tx.tag.updateMany({
          where: { id: { in: tagIds } },
          data: { usageCount: { increment: 1 } },
        });
      }
    });

    // Return updated tags
    const userTags = await prisma.userTag.findMany({
      where: { userId },
      include: { tag: true },
    });

    return NextResponse.json(userTags);
  } catch (error: any) {
    console.error("PUT /api/tags/user error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
