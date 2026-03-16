import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArchitectProfilePage({ params }: { params: { slug: string } }) {
  const architect = await prisma.architect.findUnique({
    where: { slug: params.slug },
    include: {
      courses: {
        select: {
          courseId: true,
          courseName: true,
          city: true,
          state: true,
          country: true,
          yearOpened: true,
          numHoles: true,
          courseType: true,
          media: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: { courseName: "asc" },
      },
    },
  });

  if (!architect) notFound();

  const signatureCourses = (architect.signatureCourses as string[]) || [];
  const notableFeatures = (architect.notableFeatures as string[]) || [];
  const lifespan = architect.bornYear
    ? `${architect.bornYear}–${architect.diedYear || "present"}`
    : null;

  // Era badge color
  const eraColor: Record<string, string> = {
    "Golden Age": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Post-War": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Modern": "bg-green-500/10 text-green-400 border-green-500/20",
    "Modern/Renaissance": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Early/Pre-Golden Age": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111111]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link href="/architects" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Architects
          </Link>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{architect.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {lifespan && <span className="text-sm text-gray-400">{lifespan}</span>}
                {architect.nationality && (
                  <span className="text-sm text-gray-400">{architect.nationality}</span>
                )}
                {architect.era && (
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${eraColor[architect.era] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                    {architect.era}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-center">
              {architect.totalCoursesDesigned && (
                <div className="rounded-lg border border-gray-800 bg-[#0a0a0a] px-4 py-2">
                  <div className="text-2xl font-bold text-green-500">{architect.totalCoursesDesigned}</div>
                  <div className="text-xs text-gray-500">Courses Designed</div>
                </div>
              )}
              <div className="rounded-lg border border-gray-800 bg-[#0a0a0a] px-4 py-2">
                <div className="text-2xl font-bold text-green-500">{architect.courses.length}</div>
                <div className="text-xs text-gray-500">In Database</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Biography */}
            {architect.bio && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-white">Biography</h2>
                <p className="text-sm leading-relaxed text-gray-300">{architect.bio}</p>
              </section>
            )}

            {/* Design Philosophy */}
            {architect.designPhilosophy && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-white">Design Philosophy</h2>
                <div className="rounded-lg border border-gray-800 bg-[#111111] p-4">
                  <p className="text-sm italic leading-relaxed text-gray-300">
                    &ldquo;{architect.designPhilosophy}&rdquo;
                  </p>
                </div>
              </section>
            )}

            {/* Courses in Database */}
            {architect.courses.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-white">
                  Courses in Database ({architect.courses.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {architect.courses.map((course) => {
                    const location = [course.city, course.state, course.country]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <Link
                        key={course.courseId}
                        href={`/course/${course.courseId}`}
                        className="group rounded-lg border border-gray-800 bg-[#111111] p-4 transition-colors hover:border-green-500/30"
                      >
                        <div className="flex items-start gap-3">
                          {course.media?.[0]?.url ? (
                            <img
                              src={course.media[0].url}
                              alt={course.courseName}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-800">
                              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-white group-hover:text-green-400 transition-colors truncate">
                              {course.courseName}
                            </h3>
                            {location && (
                              <p className="mt-0.5 text-xs text-gray-500 truncate">{location}</p>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                              {course.yearOpened && <span>Est. {course.yearOpened}</span>}
                              {course.numHoles && <span>{course.numHoles} holes</span>}
                              {course.courseType && <span>{course.courseType}</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Signature Courses */}
            {signatureCourses.length > 0 && (
              <section className="rounded-lg border border-gray-800 bg-[#111111] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Signature Courses</h3>
                <ul className="space-y-1.5">
                  {signatureCourses.map((name, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Notable Features */}
            {notableFeatures.length > 0 && (
              <section className="rounded-lg border border-gray-800 bg-[#111111] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Notable Design Features</h3>
                <div className="flex flex-wrap gap-2">
                  {notableFeatures.map((feature, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800/50 px-2.5 py-1 text-xs text-gray-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Era Timeline */}
            {architect.bornYear && (
              <section className="rounded-lg border border-gray-800 bg-[#111111] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Timeline</h3>
                <div className="space-y-3">
                  <TimelineItem year={architect.bornYear} label="Born" />
                  {architect.diedYear && (
                    <TimelineItem year={architect.diedYear} label="Died" />
                  )}
                  <TimelineItem
                    year={architect.bornYear + (architect.diedYear ? Math.round((architect.diedYear - architect.bornYear) / 2) : 30)}
                    label="Peak Career"
                    sublabel={architect.era || undefined}
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ year, label, sublabel }: { year: number; label: string; sublabel?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-xs font-mono text-gray-400">
        {year}
      </div>
      <div>
        <div className="text-sm text-white">{label}</div>
        {sublabel && <div className="text-xs text-gray-500">{sublabel}</div>}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const architect = await prisma.architect.findUnique({
    where: { slug: params.slug },
    select: { name: true, nationality: true, era: true, bio: true },
  });

  if (!architect) return { title: "Architect Not Found" };

  const title = `${architect.name} - Golf Course Architect | golfEQUALIZER`;
  const description = architect.bio?.slice(0, 155) || `Learn about ${architect.name}, ${architect.era || ""} golf course architect${architect.nationality ? ` from ${architect.nationality}` : ""}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://golfequalizer.ai/architects/${params.slug}`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
