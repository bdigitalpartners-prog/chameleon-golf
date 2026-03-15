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
    },
  });

  if (!course) notFound();

  // Serialize Decimal fields
  const serialized = JSON.parse(JSON.stringify(course, (_, v) =>
    typeof v === "object" && v !== null && "toFixed" in v ? v.toString() : v
  ));

  return <CourseDetailClient course={serialized} />;
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
