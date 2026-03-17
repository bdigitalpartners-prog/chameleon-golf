"use client";

import {
  Star, MessageSquare, Users, Lightbulb, Heart,
} from "lucide-react";
import { CircleRatingsSection } from "../CircleRatingsSection";
import { PoweredByBadge } from "@/components/brand/PoweredByBadge";
import {
  safeText, EmptyState, ComingSoon, cardStyle, mutedText, secondaryText, primaryText,
  SectionHeading, ScoreDimRow, RadarChart, IntelligenceNoteCard,
  RADAR_DIMENSIONS,
} from "./shared";

export function CommunityTab({ course }: { course: any }) {
  const csData = Array.isArray(course.chameleonScores) ? course.chameleonScores[0] : course.chameleonScores;
  const chameleonScore = csData?.chameleonScore;
  const scoreNum = chameleonScore ? parseFloat(chameleonScore) : null;

  const radarScores: Record<string, number> = {};
  if (csData) {
    for (const dim of RADAR_DIMENSIONS) {
      if (csData[dim.key]) radarScores[dim.key] = parseFloat(csData[dim.key]);
    }
  }
  const hasDimensions = Object.values(radarScores).some((v) => v > 0);

  return (
    <div className="max-w-3xl space-y-8">

      {/* Community Rating Overview */}
      {hasDimensions && (
        <section style={cardStyle}>
          <SectionHeading icon={<Star className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
            Community Rating
          </SectionHeading>

          <div className="flex items-center gap-6 mb-6">
            {scoreNum !== null && (
              <div className="flex items-center justify-center rounded-full h-20 w-20 text-2xl font-bold shrink-0" style={{
                backgroundColor: scoreNum >= 80 ? "var(--cg-accent)" : scoreNum >= 50 ? "#eab308" : "var(--cg-bg-tertiary)",
                color: scoreNum >= 50 ? "white" : "var(--cg-text-primary)",
              }}>
                {Math.round(scoreNum)}
              </div>
            )}
            <div>
              <div className="text-sm font-medium" style={primaryText}>CF Score</div>
              {csData?.totalRatings > 0 && (
                <div className="text-xs" style={mutedText}>
                  Based on {csData.totalRatings} rating{csData.totalRatings !== 1 ? "s" : ""}
                </div>
              )}
              {csData?.numListsAppeared > 0 && (
                <div className="text-xs" style={mutedText}>
                  Appeared on {csData.numListsAppeared} ranking list{csData.numListsAppeared !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
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
          <div className="mt-4 flex justify-end">
            <PoweredByBadge variant="ratings" />
          </div>
        </section>
      )}

      {/* Your Circles */}
      <CircleRatingsSection courseId={course.courseId} courseName={course.courseName} />

      {/* Community Reviews */}
      <section style={cardStyle}>
        <SectionHeading icon={<MessageSquare className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
          Community Reviews
        </SectionHeading>

        {course.ratings?.length > 0 ? (
          <div className="space-y-4">
            {course.ratings.map((r: any) => (
              <div key={r.ratingId} className="rounded-lg p-4" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                <div className="flex items-center gap-3">
                  {r.user?.image && <img src={r.user.image} alt="" className="h-8 w-8 rounded-full" />}
                  <div>
                    <div className="font-medium text-sm" style={primaryText}>
                      {safeText(r.seedReviewerName) || safeText(r.user?.name) || "Anonymous"}
                      {r.isSeed && (
                        <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--cg-text-muted)" }}>via GolfPass</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={mutedText}>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      {r.handicapAtRating != null && (
                        <span>· HCP {parseFloat(r.handicapAtRating).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                  <span className="ml-auto text-lg font-bold" style={{ color: "var(--cg-accent)" }}>
                    {parseFloat(r.overallRating).toFixed(1)}
                  </span>
                </div>
                {safeText(r.reviewTitle) && (
                  <div className="mt-2 font-medium text-sm" style={primaryText}>{safeText(r.reviewTitle)}</div>
                )}
                {safeText(r.reviewText) && (
                  <p className="mt-1 text-sm leading-relaxed" style={secondaryText}>{safeText(r.reviewText)}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageSquare className="h-8 w-8" />}
            title="Be the first to rate this course"
            description="Share your experience and help fellow golfers discover this course"
            cta={
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-7 w-7 cursor-pointer transition-colors hover:scale-110"
                    style={{ color: "var(--cg-border)", fill: "var(--cg-border)" }}
                  />
                ))}
              </div>
            }
          />
        )}
      </section>

      {/* Played It / Bucket List Counters */}
      <div className="grid grid-cols-2 gap-4">
        <section style={cardStyle}>
          <div className="text-center">
            <Star className="h-8 w-8 mx-auto mb-2" style={{ color: "#f59e0b" }} />
            <div className="text-2xl font-bold" style={primaryText}>
              {csData?.totalRatings || 0}
            </div>
            <p className="text-xs mt-1" style={mutedText}>Played It</p>
          </div>
        </section>
        <section style={cardStyle}>
          <div className="text-center">
            <Heart className="h-8 w-8 mx-auto mb-2" style={{ color: "#ef4444" }} />
            <div className="text-2xl font-bold" style={primaryText}>—</div>
            <p className="text-xs mt-1" style={mutedText}>Bucket List</p>
          </div>
        </section>
      </div>

      {/* Course Intelligence Notes */}
      {course.intelligenceNotes?.length > 0 && (
        <section style={cardStyle}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <SectionHeading
              icon={<Lightbulb className="h-5 w-5" style={{ color: "#4ade80" }} />}
              lastUpdated={course.intelligenceNotes[0]?.generatedAt}
            >
              Course Intelligence
            </SectionHeading>
            <PoweredByBadge variant="intelligence" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {course.intelligenceNotes.map((note: any) => (
              <IntelligenceNoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {/* Discussion Placeholder */}
      <section style={cardStyle}>
        <ComingSoon
          title="Discussion forum coming soon"
          description="Share tips, ask questions, and connect with other golfers who've played this course"
        />
      </section>
    </div>
  );
}
