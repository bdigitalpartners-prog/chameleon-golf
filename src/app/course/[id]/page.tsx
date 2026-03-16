import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CourseDetailClient } from "@/components/course/CourseDetailClient";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const courseId = parseInt(params.id);
  if (isNaN(courseId)) notFound();

  const course = await prisma.course.findUnique({
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
      nearbyDining: { orderBy: { sortOrder: "asc" }, take: 8 },
      nearbyLodging: { orderBy: { sortOrder: "asc" }, take: 6 },
      nearbyAttractions: { take: 8 },
      nearbyCourses: {
        include: { nearbyCourse: { include: { media: { where: { isPrimary: true }, take: 1 } } } },
        orderBy: { distanceMiles: "asc" },
        take: 8,
      },
    },
  });

  if (!course) notFound();

  // Serialize Decimal fields
  const serialized = JSON.parse(JSON.stringify(course, (_, v) =>
    typeof v === "object" && v !== null && "toFixed" in v ? v.toString() : v
  ));

  // Build location string and find primary image
  const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
  const primaryImage = course.media?.find((m: any) => m.isPrimary);
  const courseUrl = `https://golfequalizer.ai/course/${course.courseId}`;

  // Compute aggregate rating from published reviews
  const publishedRatings = course.ratings?.filter((r: any) => r.isPublished) ?? [];
  const ratingCount = publishedRatings.length;
  const avgRating =
    ratingCount > 0
      ? publishedRatings.reduce((sum: number, r: any) => sum + (r.overallRating ?? 0), 0) / ratingCount
      : null;

  // Build JSON-LD GolfCourse structured data
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
    ...(course.latitude && course.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: parseFloat(course.latitude.toString()),
            longitude: parseFloat(course.longitude.toString()),
          },
        }
      : {}),
    ...(course.phone ? { telephone: course.phone } : {}),
    ...(course.websiteUrl ? { sameAs: course.websiteUrl } : {}),
    ...(course.greenFeeLow || course.greenFeeHigh
      ? {
          priceRange:
            course.greenFeeLow && course.greenFeeHigh
              ? `$${parseFloat(course.greenFeeLow.toString())} - $${parseFloat(course.greenFeeHigh.toString())}`
              : course.greenFeeHigh
                ? `Up to $${parseFloat(course.greenFeeHigh.toString())}`
                : `From $${parseFloat(course.greenFeeLow!.toString())}`,
        }
      : {}),
    ...(course.yearOpened ? { foundingDate: course.yearOpened.toString() } : {}),
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
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://golfequalizer.ai",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Explore Courses",
        item: "https://golfequalizer.ai/explore",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: course.courseName,
        item: courseUrl,
      },
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
}
