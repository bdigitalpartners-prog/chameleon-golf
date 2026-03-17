import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, contentType, architectIds, courseIds, submittedBy, summary } = body;

    if (!title || !url || !contentType) {
      return NextResponse.json(
        { error: "title, url, and contentType are required" },
        { status: 400 }
      );
    }

    const content = await prisma.externalContent.create({
      data: {
        title,
        url,
        contentType,
        summary: summary || null,
        submittedBy: submittedBy || "anonymous",
        isApproved: false,
        architects: architectIds?.length
          ? { create: architectIds.map((id: number) => ({ architectId: id, relevance: "mentioned" })) }
          : undefined,
        courses: courseIds?.length
          ? { create: courseIds.map((id: number) => ({ courseId: id, relevance: "mentioned" })) }
          : undefined,
      },
    });

    return NextResponse.json({ success: true, id: content.id }, { status: 201 });
  } catch (err) {
    console.error("Content submit error:", err);
    return NextResponse.json({ error: "Failed to submit content" }, { status: 500 });
  }
}
