import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { uploadToR2 } from "@/lib/upload";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for large video uploads

// Next.js 14+ route segment config for body size
export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];
const ALL_ALLOWED = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB for images
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for videos

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "course-media";
    const courseId = formData.get("courseId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALL_ALLOWED.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, WebP, GIF, AVIF, MP4, WebM, MOV, AVI, MKV`,
        },
        { status: 400 }
      );
    }

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File too large. Maximum ${maxMB}MB for ${isVideo ? "videos" : "images"}` },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 60);
    const fileName = courseId
      ? `course-${courseId}/${timestamp}-${safeName}.${ext}`
      : `${timestamp}-${safeName}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2({
      file: buffer,
      fileName,
      contentType: file.type,
      folder,
    });

    return NextResponse.json({
      url,
      fileName: file.name,
      size: file.size,
      type: file.type,
      isVideo,
      mediaType: isVideo ? "video" : "image",
    });
  } catch (error: any) {
    console.error("Admin upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
