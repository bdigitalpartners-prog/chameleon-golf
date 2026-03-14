"use client";

import { MapPin, Globe, Phone, Trophy, Plane, Star, Calendar, Ruler } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

function tierBadgeClass(tier: string) {
  switch (tier) {
    case "flagship": return "chameleon-badge chameleon-badge-flagship";
    case "major": return "chameleon-badge chameleon-badge-major";
    case "specialty": return "chameleon-badge chameleon-badge-specialty";
    default: return "chameleon-badge chameleon-badge-regional";
  }
}

export function CourseDetailClient({ course }: { course: any }) {
  const primaryImage = course.media?.find((m: any) => m.isPrimary) ?? course.media?.[0];
  const chameleonScore = course.chameleonScores?.[0]?.chameleonScore;
  const scoreNum = chameleonScore ? parseFloat(chameleonScore) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero Image */}
      {primaryImage && (
        <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl bg-stone-100">
          <img src={primaryImage.url} alt={course.courseName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl drop-shadow-lg">
              {course.courseName}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-white/90">
              <MapPin className="h-4 w-4" />
              <span>{[course.city, course.state, course.country].filter(Boolean).join(", ")}</span>
            </div>
          </div>
          {scoreNum !== null && (
            <div className="absolute top-6 right-6">
              <div className={cn(
                "score-ring h-16 w-16 text-lg shadow-lg",
                scoreNum >= 80 ? "bg-brand-600 text-white" : scoreNum >= 50 ? "bg-amber-500 text-white" : "bg-white text-stone-700"
              )}>
                {Math.round(scoreNum)}
              </div>
            </div>
          )}
        </div>
      )}

      {!primaryImage && (
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-stone-900 md:text-4xl">{course.courseName}</h1>
          <div className="mt-2 flex items-center gap-2 text-stone-500">
            <MapPin className="h-4 w-4" />
            <span>{[course.city, course.state, course.country].filter(Boolean).join(", ")}</span>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Info */}
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-stone-900 mb-4">Course Information</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {course.courseStyle && <div><dt className="text-stone-500">Style</dt><dd className="font-medium">{course.courseStyle}</dd></div>}
              {course.accessType && <div><dt className="text-stone-500">Access</dt><dd className="font-medium">{course.accessType}</dd></div>}
              {course.numHoles && <div><dt className="text-stone-500">Holes</dt><dd className="font-medium">{course.numHoles}</dd></div>}
              {course.par && <div><dt className="text-stone-500">Par</dt><dd className="font-medium">{course.par}</dd></div>}
              {course.yearOpened && <div><dt className="text-stone-500">Opened</dt><dd className="font-medium">{course.yearOpened}</dd></div>}
              {course.originalArchitect && <div><dt className="text-stone-500">Architect</dt><dd className="font-medium">{course.originalArchitect}</dd></div>}
              {course.renovationArchitect && <div><dt className="text-stone-500">Renovation</dt><dd className="font-medium">{course.renovationArchitect} ({course.renovationYear})</dd></div>}
              {course.walkingPolicy && <div><dt className="text-stone-500">Walking</dt><dd className="font-medium">{course.walkingPolicy}</dd></div>}
              {(course.greenFeeLow || course.greenFeeHigh) && (
                <div><dt className="text-stone-500">Green Fees</dt><dd className="font-medium">
                  {formatCurrency(course.greenFeeLow)}{course.greenFeeHigh && course.greenFeeLow !== course.greenFeeHigh ? ` - ${formatCurrency(course.greenFeeHigh)}` : ""}
                </dd></div>
              )}
            </dl>
            <div className="mt-4 flex gap-3">
              {course.websiteUrl && (
                <a href={course.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
              {course.phone && (
                <a href={`tel:${course.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                  <Phone className="h-4 w-4" /> {course.phone}
                </a>
              )}
            </div>
          </section>

          {/* Rankings */}
          {course.rankings?.length > 0 && (
            <section className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Rankings
              </h2>
              <div className="space-y-3">
                {course.rankings.map((r: any) => (
                  <div key={r.entryId} className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
                    <div>
                      <span className="font-semibold text-stone-900">#{r.rankPosition}</span>
                      <span className="ml-2 text-stone-600">{r.list.listName}</span>
                      <span className={cn("ml-2", tierBadgeClass(r.list.prestigeTier))}>{r.list.prestigeTier}</span>
                    </div>
                    <span className="text-sm text-stone-500">{r.list.source.sourceName}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Photo Gallery */}
          {course.media?.length > 1 && (
            <section className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-xl font-semibold text-stone-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {course.media.slice(0, 9).map((m: any) => (
                  <div key={m.mediaId} className="aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
                    <img src={m.url} alt={m.caption || course.courseName} className="h-full w-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* User Ratings */}
          {course.ratings?.length > 0 && (
            <section className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" /> Community Ratings
              </h2>
              <div className="space-y-4">
                {course.ratings.map((r: any) => (
                  <div key={r.ratingId} className="rounded-lg bg-stone-50 p-4">
                    <div className="flex items-center gap-3">
                      {r.user?.image && <img src={r.user.image} alt="" className="h-8 w-8 rounded-full" />}
                      <div>
                        <div className="font-medium text-stone-900">{r.user?.name || "Anonymous"}</div>
                        <div className="text-xs text-stone-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className="ml-auto text-lg font-bold text-brand-600">{parseFloat(r.overallRating).toFixed(1)}</span>
                    </div>
                    {r.reviewText && <p className="mt-2 text-sm text-stone-600">{r.reviewText}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Airport Proximity */}
          {course.airports?.length > 0 && (
            <section className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-blue-500" /> Nearby Airports
              </h2>
              <div className="space-y-3">
                {course.airports.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-stone-900">
                        {a.airport.iataCode ? `${a.airport.iataCode} — ` : ""}{a.airport.airportName}
                      </div>
                      <div className="text-xs text-stone-500">{a.airport.airportType}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-stone-700">{parseFloat(a.distanceMiles).toFixed(0)} mi</div>
                      {a.driveTimeMinutes && <div className="text-xs text-stone-500">{a.driveTimeMinutes} min drive</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Chameleon Score Breakdown */}
          {course.chameleonScores?.[0]?.componentScores && (
            <section className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">Score Breakdown</h2>
              <div className="space-y-2">
                {Object.entries(course.chameleonScores[0].componentScores as Record<string, number>).map(([source, score]) => (
                  <div key={source} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{source}</span>
                    <span className="font-medium text-stone-900">{typeof score === 'number' ? score.toFixed(1) : score}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
