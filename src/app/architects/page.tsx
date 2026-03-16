import prisma from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Golf Course Architects | golfEQUALIZER",
  description: "Explore profiles of the greatest golf course architects in history — from Golden Age legends like Alister MacKenzie and Donald Ross to modern masters like Tom Doak and Gil Hanse.",
  openGraph: {
    title: "Golf Course Architects | golfEQUALIZER",
    description: "Explore profiles of the greatest golf course architects in history.",
    url: "https://golfequalizer.ai/architects",
    type: "website",
  },
};

export default async function ArchitectsPage() {
  const architects = await prisma.architect.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { courses: true } },
    },
    orderBy: { name: "asc" },
  });

  // Group by era
  const eraOrder = ["Early/Pre-Golden Age", "Golden Age", "Post-War", "Modern", "Modern/Renaissance"];
  const grouped = new Map<string, typeof architects>();
  for (const era of eraOrder) {
    const matching = architects.filter((a) => a.era === era);
    if (matching.length > 0) grouped.set(era, matching);
  }
  // Catch any without a standard era
  const uncategorized = architects.filter((a) => !a.era || !eraOrder.includes(a.era));
  if (uncategorized.length > 0) grouped.set("Other", uncategorized);

  const eraColor: Record<string, string> = {
    "Golden Age": "text-amber-400",
    "Post-War": "text-blue-400",
    "Modern": "text-green-400",
    "Modern/Renaissance": "text-emerald-400",
    "Early/Pre-Golden Age": "text-orange-400",
    "Other": "text-gray-400",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="border-b border-gray-800 bg-[#111111]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Golf Course Architects</h1>
          <p className="mt-2 text-sm text-gray-400">
            Profiles of {architects.length} legendary architects spanning from the origins of golf design to the modern renaissance.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-10">
        {Array.from(grouped.entries()).map(([era, archList]) => (
          <section key={era}>
            <h2 className={`mb-4 text-lg font-semibold ${eraColor[era] || "text-gray-400"}`}>
              {era}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archList.map((architect) => {
                const lifespan = architect.bornYear
                  ? `${architect.bornYear}–${architect.diedYear || "present"}`
                  : null;
                return (
                  <Link
                    key={architect.id}
                    href={`/architects/${architect.slug}`}
                    className="group rounded-lg border border-gray-800 bg-[#111111] p-4 transition-colors hover:border-green-500/30"
                  >
                    <h3 className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">
                      {architect.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      {architect.nationality && <span>{architect.nationality}</span>}
                      {lifespan && <span>{lifespan}</span>}
                    </div>
                    {architect.bio && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                        {architect.bio.slice(0, 120)}...
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {architect._count.courses} course{architect._count.courses !== 1 ? "s" : ""} in DB
                      </span>
                      {architect.totalCoursesDesigned && (
                        <span className="text-xs text-gray-600">
                          ~{architect.totalCoursesDesigned} total designed
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
