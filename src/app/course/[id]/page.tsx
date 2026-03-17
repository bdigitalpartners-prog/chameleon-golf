import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CourseDetailClient } from "@/components/course/CourseDetailClient";

export const dynamic = "force-dynamic";

/**
 * Recursively convert all non-plain values to JSON-safe types:
 * - Decimal → string
 * - Date → ISO string
 * - BigInt → string
 * - Everything else passes through
 */
function toSerializable(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "object" && obj !== null && "toFixed" in obj && typeof (obj as any).toFixed === "function") {
    return (obj as any).toString();
  }
  if (Array.isArray(obj)) return obj.map(toSerializable);
  if (typeof obj === "object" && obj !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = toSerializable(v);
    }
    return out;
  }
  return obj;
}

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const courseId = parseInt(params.id);
  if (isNaN(courseId)) notFound();

  let course: any;
  try {
    course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        rankings: {
          include: { list: { include: { source: true } } },
          orderBy: { rankPosition: "asc" },
        },
        airports: {
          include: { airport: true },
          orderBy: { distanceMiles: "asc" },
          take: 10,
        },
        chameleonScores: true,
        ratings: {
          where: { isPublished: true },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        teeBoxes: {
          orderBy: { totalYardage: "desc" },
        },
        holes: {
          orderBy: { holeNumber: "asc" },
          include: {
            teeYardages: {
              include: { tee: { select: { teeName: true, color: true } } },
            },
          },
        },
        nearbyDining: { orderBy: { sortOrder: "asc" }, take: 8 },
        nearbyLodging: { orderBy: { sortOrder: "asc" }, take: 6 },
        nearbyAttractions: { orderBy: { sortOrder: "asc" }, take: 8 },
        nearbyRvParks: { orderBy: { sortOrder: "asc" }, take: 4 },
        nearbyCourses: {
          include: { nearbyCourse: { include: { media: { where: { isPrimary: true }, take: 1 } } } },
          orderBy: { distanceMiles: "asc" },
          take: 8,
        },
        intelligenceNotes: {
          where: { isVisible: true },
          orderBy: { generatedAt: "desc" },
        },
        architect: {
          select: {
            id: true,
            name: true,
            slug: true,
            bio: true,
            era: true,
            imageUrl: true,
            portraitUrl: true,
            totalCoursesDesigned: true,
            designPhilosophy: true,
            nationality: true,
            bornYear: true,
            diedYear: true,
            firmName: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("[CourseDetailPage] Prisma query error:", err);
    notFound();
  }

  if (!course) notFound();

  // Fetch "More by This Architect" courses
  let architectCourses: any[] = [];
  if (course.architectId) {
    try {
      architectCourses = await prisma.course.findMany({
        where: {
          architectId: course.architectId,
          courseId: { not: courseId },
        },
        select: {
          courseId: true,
          courseName: true,
          city: true,
          state: true,
          country: true,
          media: { where: { isPrimary: true }, take: 1, select: { url: true } },
          chameleonScores: { select: { chameleonScore: true } },
        },
        take: 6,
      });
    } catch (err) {
      console.error("[CourseDetailPage] Architect courses query error:", err);
    }
  }

  // Serialize everything safely
  const serialized = toSerializable(course) as any;
  serialized.architectCourses = toSerializable(architectCourses);

  // Build location string and find primary image
  const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
  const primaryImage = course.media?.find((m: any) => m.isPrimary);
  const courseUrl = `https://golfequalizer.ai/course/${course.courseId}`;

  // Compute aggregate rating from published reviews
  const publishedRatings = course.ratings?.filter((r: any) => r.isPublished) ?? [];
  const ratingCount = publishedRatings.length;
  const avgRating =
    ratingCount > 0
      ? publishedRatings.reduce((sum: number, r: any) => {
          const val = r.overallRating != null ? parseFloat(String(r.overallRating)) : 0;
          return sum + val;
        }, 0) / ratingCount
      : null;

  // Build JSON-LD GolfCourse structured data
  const lat = course.latitude != null ? parseFloat(String(course.latitude)) : null;
  const lng = course.longitude != null ? parseFloat(String(course.longitude)) : null;
  const feeLow = course.greenFeeLow != null ? parseFloat(String(course.greenFeeLow)) : null;
  const feeHigh = course.greenFeeHigh != null ? parseFloat(String(course.greenFeeHigh)) : null;

  const golfCourseJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "GolfCourse",
    name: course.courseName,
    description: course.description || `Golf course in ${location}`,
    url: courseUrl,
    ...(primaryImage?.url ? { image: primaryImage.url } : {}),
    address: {
      "@type": "PostalAddress",
      ...(course.streetAddress ? { streetAddress: course.streetAddress } : {}),
      ...(course.city ? { addressLocality: course.city } : {}),
      ...(course.state ? { addressRegion: course.state } : {}),
      ...(course.zipCode ? { postalCode: course.zipCode } : {}),
      ...(course.country ? { addressCountry: course.country } : {}),
    },
    ...(lat != null && lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng } }
      : {}),
    ...(course.phone ? { telephone: course.phone } : {}),
    ...(course.websiteUrl ? { sameAs: course.websiteUrl } : {}),
    ...(feeLow != null || feeHigh != null
      ? {
          priceRange:
            feeLow != null && feeHigh != null
              ? `$${feeLow} - $${feeHigh}`
              : feeHigh != null
                ? `Up to $${feeHigh}`
                : `From $${feeLow}`,
        }
      : {}),
    ...(course.yearOpened ? { foundingDate: String(course.yearOpened) } : {}),
    ...(course.numHoles
      ? { amenityFeature: { "@type": "LocationFeatureSpecification", name: "Holes", value: course.numHoles } }
      : {}),
    ...(avgRating !== null && ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(avgRating * 10) / 10,
            bestRating: 10,
            worstRating: 1,
            ratingCount,
          },
        }
      : {}),
  };

  // Build BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://golfequalizer.ai" },
      { "@type": "ListItem", position: 2, name: "Explore Courses", item: "https://golfequalizer.ai/explore" },
      { "@type": "ListItem", position: 3, name: course.courseName, item: courseUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(golfCourseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CourseDetailClient course={serialized} />
    </>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const courseId = parseInt(params.id);
  if (isNaN(courseId)) return { title: "Course Not Found" };

  try {
    const course = await prisma.course.findUnique({
      where: { courseId },
      select: {
        courseName: true,
        city: true,
        state: true,
        country: true,
        description: true,
        originalArchitect: true,
        media: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });
    if (!course) return { title: "Course Not Found" };

    const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
    const architectInfo = course.originalArchitect ? ` Designed by ${course.originalArchitect}.` : "";
    const title = `${course.courseName} - Golf Course Details | golfEQUALIZER`;
    const description =
      course.description?.slice(0, 155) ||
      `Explore rankings, ratings, photos, and airport proximity for ${course.courseName} in ${location}.${architectInfo}`;
    const ogImage = course.media?.[0]?.url || "/og-default.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://golfequalizer.ai/course/${courseId}`,
        type: "website",
        images: [{ url: ogImage, width: 1200, height: 630, alt: course.courseName }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (err) {
    console.error("[CourseDetailPage] Metadata query error:", err);
    return { title: "Course Not Found" };
  }
}
