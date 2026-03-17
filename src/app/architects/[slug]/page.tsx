import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArchitectContentSections } from "./ArchitectContentSections";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const architect = await prisma.architect.findUnique({
    where: { slug: params.slug },
  });
  if (!architect) return { title: "Architect Not Found" };
  return {
    title: `${architect.name} — Golf Course Architect | golfEQUALIZER`,
    description:
      architect.bio?.slice(0, 160) ||
      `Learn about ${architect.name}, golf course architect.`,
  };
}

export default async function ArchitectDetailPage({ params }: Props) {
  const architect = await prisma.architect.findUnique({
    where: { slug: params.slug },
  });

  if (!architect) notFound();

  const signatureCourses = Array.isArray(architect.signatureCourses)
    ? (architect.signatureCourses as string[])
    : [];
  const notableFeatures = Array.isArray(architect.notableFeatures)
    ? (architect.notableFeatures as string[])
    : [];

  // Standard text-based course matching
  const courses = await prisma.course.findMany({
    where: { originalArchitect: architect.name },
    select: {
      courseId: true,
      courseName: true,
      city: true,
      state: true,
      country: true,
      accessType: true,
      yearOpened: true,
      chameleonScores: { select: { chameleonScore: true } },
    },
    orderBy: { courseName: "asc" },
  });

  // Cross-reference from CourseArchitect junction table
  const courseArchitectLinks = await prisma.courseArchitect.findMany({
    where: { architectId: architect.id },
    include: {
      course: {
        select: {
          courseId: true,
          courseName: true,
          city: true,
          state: true,
          country: true,
          accessType: true,
          yearOpened: true,
          originalArchitect: true,
          chameleonScores: { select: { chameleonScore: true } },
        },
      },
    },
    orderBy: { role: "asc" },
  });

  // Group by role
  const coursesByRole: Record<string, typeof courseArchitectLinks> = {};
  for (const link of courseArchitectLinks) {
    const role = link.role;
    if (!coursesByRole[role]) coursesByRole[role] = [];
    coursesByRole[role].push(link);
  }

  const roleLabels: Record<string, string> = {
    original: "Solo Designs",
    renovation: "Renovations",
    restoration: "Restorations",
    routing: "Routing",
    consulting: "Consulting",
  };

  const cardStyle = {
    backgroundColor: "var(--cg-bg-card)",
    border: "1px solid var(--cg-border)",
    borderRadius: "0.75rem",
    padding: "1.5rem",
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          <Link
            href="/architects"
            className="transition-colors hover:underline"
            style={{ color: "var(--cg-accent)" }}
          >
            Architects
          </Link>
          <span className="mx-2">/</span>
          <span style={{ color: "var(--cg-text-secondary)" }}>
            {architect.name}
          </span>
        </nav>

        {/* Header */}
        <div style={cardStyle} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {(architect.portraitUrl || architect.imageUrl) && (
              <img
                src={architect.portraitUrl || architect.imageUrl!}
                alt={architect.name}
                className="h-32 w-32 rounded-lg object-cover flex-shrink-0"
                style={{ border: "1px solid var(--cg-border)" }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl font-bold sm:text-3xl"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {architect.name}
              </h1>
              <div
                className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm"
                style={{ color: "var(--cg-text-muted)" }}
              >
                {architect.nationality && <span>{architect.nationality}</span>}
                {architect.bornYear && (
                  <span>
                    {architect.bornYear}
                    {architect.diedYear
                      ? `–${architect.diedYear}`
                      : "–present"}
                  </span>
                )}
                {architect.era && <span>{architect.era} Era</span>}
                {architect.firmName && <span>{architect.firmName}</span>}
                {architect.totalCoursesDesigned && (
                  <span>
                    ~{architect.totalCoursesDesigned} courses designed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                {courses.length > 0 && (
                  <span
                    className="text-sm"
                    style={{ color: "var(--cg-accent)" }}
                  >
                    {courses.length} {courses.length === 1 ? "course" : "courses"}{" "}
                    in our database
                  </span>
                )}
                {architect.websiteUrl && (
                  <a
                    href={architect.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "var(--cg-accent)" }}
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {architect.bio && (
          <section style={cardStyle} className="mb-6">
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Biography
            </h2>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{
                color: "var(--cg-text-secondary)",
                lineHeight: "1.75",
              }}
            >
              {architect.bio}
            </p>
          </section>
        )}

        {/* Design Philosophy */}
        {architect.designPhilosophy && (
          <section style={cardStyle} className="mb-6">
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Design Philosophy
            </h2>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{
                color: "var(--cg-text-secondary)",
                lineHeight: "1.75",
              }}
            >
              {architect.designPhilosophy}
            </p>
          </section>
        )}

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Signature Courses */}
          {signatureCourses.length > 0 && (
              <section style={cardStyle}>
                <h2
                  className="mb-3 text-lg font-semibold"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  Signature Courses
                </h2>
                <ul className="space-y-1.5">
                  {signatureCourses.map((course) => (
                    <li
                      key={course}
                      className="text-sm"
                      style={{ color: "var(--cg-text-secondary)" }}
                    >
                      {course}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          {/* Notable Features */}
          {notableFeatures.length > 0 && (
              <section style={cardStyle}>
                <h2
                  className="mb-3 text-lg font-semibold"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  Notable Design Features
                </h2>
                <div className="flex flex-wrap gap-2">
                  {notableFeatures.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--cg-bg-secondary)",
                        color: "var(--cg-text-secondary)",
                        border: "1px solid var(--cg-border)",
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </section>
            )}
        </div>

        {/* Cross-Reference Sections (by role) */}
        {Object.keys(coursesByRole).length > 0 && (
          <div className="space-y-6 mb-6">
            {Object.entries(coursesByRole).map(([role, links]) => (
              <section key={role} style={cardStyle}>
                <h2
                  className="mb-4 text-lg font-semibold"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {roleLabels[role] || role}
                  <span
                    className="ml-2 text-sm font-normal"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    ({links.length})
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--cg-border)", color: "var(--cg-text-muted)" }}>
                        <th className="pb-2 pr-4 text-left font-medium">Course</th>
                        <th className="pb-2 pr-4 text-left font-medium">Location</th>
                        <th className="pb-2 pr-4 text-left font-medium">Year</th>
                        {role !== "original" && <th className="pb-2 pr-4 text-left font-medium">Notes</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {links.map((link) => (
                        <tr key={link.id} style={{ borderBottom: "1px solid var(--cg-border)" }}>
                          <td className="py-2.5 pr-4">
                            <Link
                              href={`/course/${link.course.courseId}`}
                              className="font-medium transition-colors hover:underline"
                              style={{ color: "var(--cg-text-primary)" }}
                            >
                              {link.course.courseName}
                            </Link>
                            {role !== "original" && link.course.originalArchitect && (
                              <span className="text-xs ml-2" style={{ color: "var(--cg-text-muted)" }}>
                                (orig: {link.course.originalArchitect})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4" style={{ color: "var(--cg-text-muted)" }}>
                            {[link.course.city, link.course.state, link.course.country].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="py-2.5 pr-4" style={{ color: "var(--cg-text-muted)" }}>
                            {link.year || link.course.yearOpened || "—"}
                          </td>
                          {role !== "original" && (
                            <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                              {link.notes || "—"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Courses in Database (text-match fallback) */}
        {courses.length > 0 && (
          <section style={cardStyle} className="mb-6">
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Courses in Our Database
              <span
                className="ml-2 text-sm font-normal"
                style={{ color: "var(--cg-text-muted)" }}
              >
                ({courses.length})
              </span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--cg-border)",
                      color: "var(--cg-text-muted)",
                    }}
                  >
                    <th className="pb-2 pr-4 text-left font-medium">Course</th>
                    <th className="pb-2 pr-4 text-left font-medium">
                      Location
                    </th>
                    <th className="pb-2 pr-4 text-left font-medium">Access</th>
                    <th className="pb-2 pr-4 text-left font-medium">Year</th>
                    <th className="pb-2 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.courseId}
                      style={{ borderBottom: "1px solid var(--cg-border)" }}
                    >
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/course/${course.courseId}`}
                          className="font-medium transition-colors"
                          style={{ color: "var(--cg-text-primary)" }}
                          onMouseEnter={(e: any) =>
                            (e.currentTarget.style.color = "var(--cg-accent)")
                          }
                          onMouseLeave={(e: any) =>
                            (e.currentTarget.style.color =
                              "var(--cg-text-primary)")
                          }
                        >
                          {course.courseName}
                        </Link>
                      </td>
                      <td
                        className="py-2.5 pr-4"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        {[course.city, course.state, course.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>
                      <td
                        className="py-2.5 pr-4"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        {course.accessType || "—"}
                      </td>
                      <td
                        className="py-2.5 pr-4"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        {course.yearOpened || "—"}
                      </td>
                      <td
                        className="py-2.5 text-right font-mono"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {course.chameleonScores
                          ? Number(course.chameleonScores.chameleonScore).toFixed(
                              1
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Content and Books sections (client component) */}
        <ArchitectContentSections architectId={architect.id} />
      </div>
    </div>
  );
}
