import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CourseDetailClient } from "@/components/course/CourseDetailClient";

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

  // Build JSON-LD structured data
  const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
  const primaryImage = course.media?.find((m: any) => m.isPrimary);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GolfCourse",
    name: course.courseName,
    description: course.description || `Golf course in ${location}`,
    url: `https://golfequalizer.ai/course/${course.courseId}`,
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
    ...(course.numHoles ? { amenityFeature: { "@type": "LocationFeatureSpecification", name: "Holes", value: course.numHoles } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CourseDetailClient course={serialized} />
    </>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const courseId = parseInt(params.id);
  if (isNaN(courseId)) return { title: "Course Not Found" };
  const course = await prisma.course.findUnique({
    where: { courseId },
    select: { courseName: true, city: true, state: true, country: true, description: true },
  });
  if (!course) return { title: "Course Not Found" };
  const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
  return {
    title: `${course.courseName} — golfEQUALIZER`,
    description: course.description || `Explore rankings, ratings, photos, and airport proximity for ${course.courseName} in ${location}.`,
  };
}
