import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Golf Course Architects | golfEQUALIZER",
  description:
    "Explore profiles of legendary golf course architects — from Donald Ross and Alister MacKenzie to modern masters like Tom Fazio, Pete Dye, and Coore & Crenshaw.",
};

export default async function ArchitectsPage() {
  const architects = await prisma.architect.findMany({
    orderBy: { name: "asc" },
  });

  // Get course counts for all architects
  const courseCounts = await prisma.course.groupBy({
    by: ["originalArchitect"],
    where: {
      originalArchitect: { in: architects.map((a) => a.name) },
    },
    _count: { courseId: true },
  });

  const courseCountMap = new Map(
    courseCounts.map((c) => [c.originalArchitect, c._count.courseId])
  );

  const architectsWithCounts = architects.map((a) => ({
    ...a,
    courseCount: courseCountMap.get(a.name) || 0,
  }));

  // Group by era
  const eras = [
    "Pioneer",
    "Golden Age",
    "Post-War",
    "Modern",
    "Contemporary",
  ];
  const grouped = eras.map((era) => ({
    era,
    architects: architectsWithCounts.filter((a) => a.era === era),
  }));
  const ungrouped = architectsWithCounts.filter(
    (a) => !a.era || !eras.includes(a.era)
  );
  if (ungrouped.length > 0) {
    grouped.push({ era: "Other", architects: ungrouped });
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Golf Course Architects
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--cg-text-muted)" }}
          >
            {architects.length} architects spanning centuries of golf course
            design
          </p>
        </div>

        {grouped
          .filter((g) => g.architects.length > 0)
          .map((group) => (
            <section key={group.era} className="mb-10">
              <h2
                className="mb-4 text-lg font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {group.era} Era
                <span
                  className="ml-2 text-sm font-normal"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  ({group.architects.length})
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.architects.map((architect) => (
                  <Link
                    key={architect.id}
                    href={`/architects/${architect.slug}`}
                    className="rounded-xl p-5 transition-all hover:scale-[1.01]"
                    style={{
                      backgroundColor: "var(--cg-bg-card)",
                      border: "1px solid var(--cg-border)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold truncate"
                          style={{ color: "var(--cg-text-primary)" }}
                        >
                          {architect.name}
                        </h3>
                        <div
                          className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {architect.nationality && (
                            <span>{architect.nationality}</span>
                          )}
                          {architect.bornYear && (
                            <span>
                              {architect.bornYear}
                              {architect.diedYear
                                ? `–${architect.diedYear}`
                                : "–present"}
                            </span>
                          )}
                        </div>
                      </div>
                      {architect.courseCount > 0 && (
                        <span
                          className="ml-3 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: "var(--cg-accent)",
                            color: "var(--cg-text-inverse)",
                          }}
                        >
                          {architect.courseCount}{" "}
                          {architect.courseCount === 1 ? "course" : "courses"}
                        </span>
                      )}
                    </div>
                    {architect.bio && (
                      <p
                        className="mt-3 text-xs leading-relaxed line-clamp-3"
                        style={{ color: "var(--cg-text-secondary)" }}
                      >
                        {architect.bio}
                      </p>
                    )}
                    {architect.notableFeatures &&
                      architect.notableFeatures.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {architect.notableFeatures
                            .slice(0, 3)
                            .map((feature) => (
                              <span
                                key={feature}
                                className="rounded-full px-2 py-0.5 text-[10px]"
                                style={{
                                  backgroundColor: "var(--cg-bg-secondary)",
                                  color: "var(--cg-text-muted)",
                                  border: "1px solid var(--cg-border)",
                                }}
                              >
                                {feature}
                              </span>
                            ))}
                        </div>
                      )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
