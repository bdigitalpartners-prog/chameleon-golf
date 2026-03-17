import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArchitectContentSections } from "./ArchitectContentSections";
import { ArchitectPortfolio } from "./ArchitectPortfolio";
import { ArchitectDesignSignature } from "./ArchitectDesignSignature";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

/**
 * Recursively convert Decimal/Date/BigInt to JSON-safe types.
 */
function toSerializable(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (
    typeof obj === "object" &&
    obj !== null &&
    "toFixed" in obj &&
    typeof (obj as any).toFixed === "function"
  ) {
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

  // Standard text-based course matching + FK-based matching
  let courses: any[] = [];
  let courseArchitectLinks: any[] = [];
  let rankingPresence: any[] = [];
  let relatedArchitects: any[] = [];
  try {
    const [fkCourses, textCourses] = await Promise.all([
      prisma.course.findMany({
        where: { architectId: architect.id },
        select: {
          courseId: true,
          courseName: true,
          city: true,
          state: true,
          country: true,
          accessType: true,
          yearOpened: true,
          chameleonScores: { select: { chameleonScore: true } },
          media: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
        orderBy: { courseName: "asc" },
      }),
      prisma.course.findMany({
        where: {
          originalArchitect: architect.name,
          architectId: { not: architect.id },
        },
        select: {
          courseId: true,
          courseName: true,
          city: true,
          state: true,
          country: true,
          accessType: true,
          yearOpened: true,
          chameleonScores: { select: { chameleonScore: true } },
          media: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
        orderBy: { courseName: "asc" },
      }),
    ]);

    // Merge and deduplicate by courseId
    const seen = new Set<number>();
    courses = [...fkCourses, ...textCourses].filter((c) => {
      if (seen.has(c.courseId)) return false;
      seen.add(c.courseId);
      return true;
    });
  } catch (e) {
    console.error("Error fetching courses for architect:", e);
  }

  try {
    courseArchitectLinks = await prisma.courseArchitect.findMany({
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
  } catch (e) {
    console.error("Error fetching courseArchitect links:", e);
  }

  // Ranking presence — aggregate how many ranking lists this architect's courses appear on
  try {
    const courseIds = courses.map((c) => c.courseId);
    if (courseIds.length > 0) {
      const rankings = await prisma.rankingEntry.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          list: { include: { source: true } },
        },
      });
      // Group by source
      const sourceMap: Record<string, { sourceName: string; count: number; listIds: number[] }> = {};
      for (const r of rankings) {
        const sName = r.list.source.sourceName;
        if (!sourceMap[sName]) sourceMap[sName] = { sourceName: sName, count: 0, listIds: [] };
        sourceMap[sName].count++;
        if (!sourceMap[sName].listIds.includes(r.listId)) sourceMap[sName].listIds.push(r.listId);
      }
      rankingPresence = Object.values(sourceMap);
    }
  } catch (e) {
    console.error("Error fetching ranking presence:", e);
  }

  // Related architects — same era + same nationality
  try {
    const orConditions: any[] = [];
    if (architect.era) orConditions.push({ era: architect.era });
    if (architect.nationality) orConditions.push({ nationality: architect.nationality });
    if (orConditions.length > 0) {
      relatedArchitects = await prisma.architect.findMany({
        where: {
          id: { not: architect.id },
          OR: orConditions,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          era: true,
          nationality: true,
          portraitUrl: true,
          imageUrl: true,
          _count: { select: { courses: true } },
        },
        take: 6,
      });
    }
  } catch (e) {
    console.error("Error fetching related architects:", e);
  }

  // Fetch design DNA for architect's courses
  let designDnaList: any[] = [];
  let architectRenovations: any[] = [];
  try {
    const courseIds = courses.map((c) => c.courseId);
    if (courseIds.length > 0) {
      const [dnaResults, renResults] = await Promise.all([
        prisma.courseDesignDNA.findMany({
          where: { courseId: { in: courseIds } },
        }),
        prisma.courseRenovation.findMany({
          where: { architectId: architect.id },
          include: {
            course: {
              select: { courseId: true, courseName: true },
            },
          },
          orderBy: { year: "asc" },
        }),
      ]);
      designDnaList = dnaResults;
      architectRenovations = renResults;
    }
  } catch (e) {
    console.error("Error fetching design DNA for architect:", e);
  }

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

  // Serialize all data for safe rendering (Decimal → string)
  const serializedCourses = toSerializable(courses) as any[];
  const serializedLinks = toSerializable(courseArchitectLinks) as any[];
  const serializedRelated = toSerializable(relatedArchitects) as any[];
  const serializedDnaList = toSerializable(designDnaList) as any[];
  const serializedRenovations = toSerializable(architectRenovations) as any[];

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

        {/* Design Signature (client component with design DNA) */}
        <ArchitectDesignSignature
          dnaList={serializedDnaList}
          renovations={serializedRenovations}
        />

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
            {Object.entries(coursesByRole).map(([role, links]) => {
              const sLinks = toSerializable(links) as any[];
              return (
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
                      ({sLinks.length})
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
                        {sLinks.map((link: any) => (
                          <tr key={link.id} style={{ borderBottom: "1px solid var(--cg-border)" }}>
                            <td className="py-2.5 pr-4">
                              <Link
                                href={`/course/${link.course.courseId}`}
                                className="font-medium transition-colors hover:underline hover:text-emerald-400"
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
              );
            })}
          </div>
        )}

        {/* Portfolio — Interactive course grid (client component) */}
        <ArchitectPortfolio
          courses={serializedCourses}
          architectName={architect.name}
        />

        {/* Ranking Presence */}
        {rankingPresence.length > 0 && (
          <section style={cardStyle} className="mb-6">
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Ranking Presence
            </h2>
            <p className="text-sm mb-3" style={{ color: "var(--cg-text-secondary)" }}>
              Courses by {architect.name} appear across{" "}
              <span style={{ color: "var(--cg-accent)" }}>
                {rankingPresence.reduce((sum, s) => sum + s.count, 0)} ranking entries
              </span>{" "}
              from {rankingPresence.length} sources.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {rankingPresence.map((source) => (
                <div
                  key={source.sourceName}
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: "var(--cg-bg-secondary)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {source.sourceName}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--cg-accent)" }}>
                    {source.count} course{source.count !== 1 ? "s" : ""} ranked
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Architects */}
        {serializedRelated.length > 0 && (
          <section style={cardStyle} className="mb-6">
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Related Architects
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {serializedRelated.map((ra: any) => (
                <Link
                  key={ra.id}
                  href={`/architects/${ra.slug}`}
                  className="rounded-lg p-4 transition-all hover:ring-1 hover:ring-emerald-500"
                  style={{
                    backgroundColor: "var(--cg-bg-secondary)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {(ra.portraitUrl || ra.imageUrl) && (
                      <img
                        src={ra.portraitUrl || ra.imageUrl}
                        alt={ra.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                        {ra.name}
                      </div>
                      <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        {[ra.era, ra.nationality].filter(Boolean).join(" · ")}
                      </div>
                      {ra._count?.courses > 0 && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--cg-accent)" }}>
                          {ra._count.courses} course{ra._count.courses !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* External Content — Coming Soon placeholders */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {["Further Reading", "Watch", "Bookshelf"].map((title) => (
            <section key={title} style={cardStyle}>
              <h2
                className="mb-2 text-lg font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {title}
              </h2>
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Coming Soon
              </p>
            </section>
          ))}
        </div>

        {/* Content and Books sections (client component) */}
        <ArchitectContentSections architectId={architect.id} />
      </div>
    </div>
  );
}
