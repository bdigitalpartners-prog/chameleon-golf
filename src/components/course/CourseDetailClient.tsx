"use client";

import { MapPin, Globe, Phone, Trophy, Plane, Star, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function tierBadgeStyle(tier: string): React.CSSProperties {
  switch (tier) {
    case "flagship":
      return { backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" };
    case "major":
      return { backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)" };
    case "specialty":
      return { backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" };
    default:
      return { backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)", border: "1px solid var(--cg-border)" };
  }
}

const RADAR_DIMENSIONS = [
  { key: "avgConditioning", label: "Cond." },
  { key: "avgLayoutDesign", label: "Layout" },
  { key: "avgAesthetics", label: "Aesth." },
  { key: "avgChallenge", label: "Challenge" },
  { key: "avgValue", label: "Value" },
  { key: "avgWalkability", label: "Walk." },
  { key: "avgPace", label: "Pace" },
  { key: "avgAmenities", label: "Amen." },
  { key: "avgService", label: "Service" },
];

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const n = RADAR_DIMENSIONS.length;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;

  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, radius: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPath = (level: number) => {
    const pts = RADAR_DIMENSIONS.map((_, i) => getPoint(i, level * r));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";
  };

  const dataPath = () => {
    const pts = RADAR_DIMENSIONS.map((dim, i) => {
      const val = scores[dim.key] ?? 0;
      return getPoint(i, (val / 10) * r);
    });
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";
  };

  const hasData = RADAR_DIMENSIONS.some((d) => (scores[d.key] ?? 0) > 0);
  if (!hasData) return null;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[220px] mx-auto">
      {gridLevels.map((level) => (
        <path key={level} d={gridPath(level)} fill="none" stroke="var(--cg-border)" strokeWidth="0.5" />
      ))}
      {RADAR_DIMENSIONS.map((_, i) => {
        const pt = getPoint(i, r);
        return (
          <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="var(--cg-border)" strokeWidth="0.5" />
        );
      })}
      <path d={dataPath()} fill="rgba(168,85,247,0.2)" stroke="var(--cg-accent)" strokeWidth="1.5" />
      {RADAR_DIMENSIONS.map((dim, i) => {
        const pt = getPoint(i, r + 16);
        return (
          <text key={dim.key} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="var(--cg-text-muted)">
            {dim.label}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreDimRow({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs" style={{ color: "var(--cg-text-muted)" }}>
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: "var(--cg-accent)" }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums" style={{ color: "var(--cg-text-primary)" }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};

export function CourseDetailClient({ course }: { course: any }) {
  const primaryImage = course.media?.find((m: any) => m.isPrimary) ?? course.media?.[0];
  // Support both array (old) and object (new) chameleonScores
  const csData = Array.isArray(course.chameleonScores)
    ? course.chameleonScores[0]
    : course.chameleonScores;
  const chameleonScore = csData?.chameleonScore;
  const scoreNum = chameleonScore ? parseFloat(chameleonScore) : null;

  const radarScores: Record<string, number> = {};
  if (csData) {
    if (csData.avgConditioning) radarScores.avgConditioning = parseFloat(csData.avgConditioning);
    if (csData.avgLayoutDesign) radarScores.avgLayoutDesign = parseFloat(csData.avgLayoutDesign);
    if (csData.avgAesthetics) radarScores.avgAesthetics = parseFloat(csData.avgAesthetics);
    if (csData.avgChallenge) radarScores.avgChallenge = parseFloat(csData.avgChallenge);
    if (csData.avgValue) radarScores.avgValue = parseFloat(csData.avgValue);
    if (csData.avgWalkability) radarScores.avgWalkability = parseFloat(csData.avgWalkability);
    if (csData.avgPace) radarScores.avgPace = parseFloat(csData.avgPace);
    if (csData.avgAmenities) radarScores.avgAmenities = parseFloat(csData.avgAmenities);
    if (csData.avgService) radarScores.avgService = parseFloat(csData.avgService);
  }

  const hasDimensions = Object.values(radarScores).some((v) => v > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* Hero Image */}
      {primaryImage && (
        <div
          className="relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl"
          style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
        >
          <img src={primaryImage.url} alt={course.courseName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
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
              <div
                className="score-ring h-16 w-16 text-lg shadow-lg"
                style={{
                  backgroundColor: scoreNum >= 80 ? "var(--cg-accent)" : scoreNum >= 50 ? "#eab308" : "var(--cg-bg-card)",
                  color: scoreNum >= 50 ? "white" : "var(--cg-text-primary)",
                }}
              >
                {Math.round(scoreNum)}
              </div>
            </div>
          )}
        </div>
      )}

      {!primaryImage && (
        <div className="mb-8">
          <h1
            className="font-display text-3xl font-bold md:text-4xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            {course.courseName}
          </h1>
          <div className="mt-2 flex items-center gap-2" style={{ color: "var(--cg-text-secondary)" }}>
            <MapPin className="h-4 w-4" />
            <span>{[course.city, course.state, course.country].filter(Boolean).join(", ")}</span>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Info */}
          <section style={cardStyle}>
            <h2
              className="font-display text-xl font-semibold mb-4"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Course Information
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {course.courseStyle && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Style</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>{course.courseStyle}</dd>
                </div>
              )}
              {course.accessType && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Access</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>{course.accessType}</dd>
                </div>
              )}
              {course.numHoles && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Holes</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>{course.numHoles}</dd>
                </div>
              )}
              {course.par && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Par</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>{course.par}</dd>
                </div>
              )}
              {course.yearOpened && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Opened</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>{course.yearOpened}</dd>
                </div>
              )}
              {course.originalArchitect && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Architect</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>{course.originalArchitect}</dd>
                </div>
              )}
              {course.renovationArchitect && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Renovation</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {course.renovationArchitect}{course.renovationYear ? ` (${course.renovationYear})` : ""}
                  </dd>
                </div>
              )}
              {course.walkingPolicy && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Walking</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>{course.walkingPolicy}</dd>
                </div>
              )}
              {(course.greenFeeLow || course.greenFeeHigh) && (
                <div>
                  <dt className="mb-0.5" style={{ color: "var(--cg-text-muted)" }}>Green Fees</dt>
                  <dd className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {formatCurrency(course.greenFeeLow)}
                    {course.greenFeeHigh && course.greenFeeLow !== course.greenFeeHigh
                      ? ` – ${formatCurrency(course.greenFeeHigh)}`
                      : ""}
                  </dd>
                </div>
              )}
            </dl>
            {/* Tee Boxes */}
            {course.teeBoxes?.length > 0 && (
              <div className="mt-5">
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  Tee Boxes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {course.teeBoxes.map((tee: any) => (
                    <div
                      key={tee.teeId}
                      className="rounded-lg px-3 py-2 text-xs"
                      style={{
                        backgroundColor: "var(--cg-bg-tertiary)",
                        border: "1px solid var(--cg-border)",
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {tee.color && (
                          <span
                            className="h-2.5 w-2.5 rounded-full inline-block"
                            style={{ backgroundColor: tee.color.toLowerCase() }}
                          />
                        )}
                        <span className="font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                          {tee.teeName}
                        </span>
                      </div>
                      {tee.totalYardage && (
                        <div style={{ color: "var(--cg-text-muted)" }}>{tee.totalYardage.toLocaleString()} yds</div>
                      )}
                      {tee.courseRating && tee.slopeRating && (
                        <div style={{ color: "var(--cg-text-muted)" }}>
                          {parseFloat(tee.courseRating).toFixed(1)} / {tee.slopeRating}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 flex gap-3 flex-wrap">
              {course.websiteUrl && (
                <a
                  href={course.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    border: "1px solid var(--cg-border)",
                    color: "var(--cg-text-secondary)",
                    backgroundColor: "var(--cg-bg-tertiary)",
                  }}
                >
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
              {course.phone && (
                <a
                  href={`tel:${course.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    border: "1px solid var(--cg-border)",
                    color: "var(--cg-text-secondary)",
                    backgroundColor: "var(--cg-bg-tertiary)",
                  }}
                >
                  <Phone className="h-4 w-4" /> {course.phone}
                </a>
              )}
            </div>
          </section>

          {/* Rankings */}
          {course.rankings?.length > 0 && (
            <section style={cardStyle}>
              <h2
                className="font-display text-xl font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--cg-text-primary)" }}
              >
                <Trophy className="h-5 w-5" style={{ color: "#f59e0b" }} />
                Rankings
              </h2>
              <div className="space-y-2">
                {course.rankings.map((r: any) => (
                  <div
                    key={r.entryId}
                    className="flex items-center justify-between rounded-lg px-4 py-3"
                    style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base" style={{ color: "var(--cg-accent)" }}>
                        #{r.rankPosition}
                      </span>
                      <span className="text-sm" style={{ color: "var(--cg-text-primary)" }}>
                        {r.list.listName}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs capitalize"
                        style={tierBadgeStyle(r.list.prestigeTier)}
                      >
                        {r.list.prestigeTier}
                      </span>
                    </div>
                    <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                      {r.list.source.sourceName}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Photo Gallery */}
          {course.media?.length > 1 && (
            <section style={cardStyle}>
              <h2
                className="font-display text-xl font-semibold mb-4"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Photos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {course.media.slice(0, 9).map((m: any) => (
                  <div
                    key={m.mediaId}
                    className="aspect-[4/3] overflow-hidden rounded-lg"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                  >
                    <img
                      src={m.url}
                      alt={m.caption || course.courseName}
                      className="h-full w-full object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Community Ratings */}
          {course.ratings?.length > 0 && (
            <section style={cardStyle}>
              <h2
                className="font-display text-xl font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--cg-text-primary)" }}
              >
                <Star className="h-5 w-5" style={{ color: "#f59e0b" }} />
                Community Ratings
              </h2>
              <div className="space-y-4">
                {course.ratings.map((r: any) => (
                  <div
                    key={r.ratingId}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                  >
                    <div className="flex items-center gap-3">
                      {r.user?.image && (
                        <img src={r.user.image} alt="" className="h-8 w-8 rounded-full" />
                      )}
                      <div>
                        <div className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
                          {r.user?.name || "Anonymous"}
                        </div>
                        <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className="ml-auto text-lg font-bold"
                        style={{ color: "var(--cg-accent)" }}
                      >
                        {parseFloat(r.overallRating).toFixed(1)}
                      </span>
                    </div>
                    {r.reviewText && (
                      <p className="mt-2 text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                        {r.reviewText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Chameleon Score */}
          {csData && (
            <section style={cardStyle}>
              <h2
                className="font-display text-lg font-semibold mb-4"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Chameleon Score
              </h2>
              {scoreNum !== null && (
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="score-ring h-16 w-16 text-xl shrink-0"
                    style={{
                      backgroundColor: scoreNum >= 80 ? "var(--cg-accent)" : scoreNum >= 50 ? "#eab308" : "var(--cg-bg-tertiary)",
                      color: scoreNum >= 50 ? "white" : "var(--cg-text-primary)",
                    }}
                  >
                    {Math.round(scoreNum)}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                      Overall Score
                    </div>
                    {csData.totalRatings > 0 && (
                      <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        Based on {csData.totalRatings} rating{csData.totalRatings !== 1 ? "s" : ""}
                      </div>
                    )}
                    {csData.numListsAppeared > 0 && (
                      <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        Appeared on {csData.numListsAppeared} ranking list{csData.numListsAppeared !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasDimensions && (
                <>
                  <div className="mb-4">
                    <RadarChart scores={radarScores} />
                  </div>
                  <div className="space-y-2.5">
                    <ScoreDimRow label="Conditioning" value={radarScores.avgConditioning ?? null} />
                    <ScoreDimRow label="Layout & Design" value={radarScores.avgLayoutDesign ?? null} />
                    <ScoreDimRow label="Aesthetics" value={radarScores.avgAesthetics ?? null} />
                    <ScoreDimRow label="Challenge" value={radarScores.avgChallenge ?? null} />
                    <ScoreDimRow label="Value" value={radarScores.avgValue ?? null} />
                    <ScoreDimRow label="Walkability" value={radarScores.avgWalkability ?? null} />
                    <ScoreDimRow label="Pace of Play" value={radarScores.avgPace ?? null} />
                    <ScoreDimRow label="Amenities" value={radarScores.avgAmenities ?? null} />
                    <ScoreDimRow label="Service" value={radarScores.avgService ?? null} />
                  </div>
                </>
              )}
            </section>
          )}

          {/* Airport Proximity */}
          {course.airports?.length > 0 && (
            <section style={cardStyle}>
              <h2
                className="font-display text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--cg-text-primary)" }}
              >
                <Plane className="h-5 w-5" style={{ color: "#60a5fa" }} />
                Nearby Airports
              </h2>
              <div className="space-y-3">
                {course.airports.slice(0, 5).map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-sm"
                    style={{ borderBottom: "1px solid var(--cg-border)", paddingBottom: "0.5rem" }}
                  >
                    <div>
                      <div className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
                        {a.airport.iataCode ? `${a.airport.iataCode} — ` : ""}{a.airport.airportName}
                      </div>
                      <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        {a.airport.airportType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium" style={{ color: "var(--cg-text-secondary)" }}>
                        {parseFloat(a.distanceMiles).toFixed(0)} mi
                      </div>
                      {a.driveTimeMinutes && (
                        <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                          {a.driveTimeMinutes} min drive
                        </div>
                      )}
                    </div>
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
