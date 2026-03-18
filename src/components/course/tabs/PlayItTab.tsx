"use client";

import {
  DollarSign, Compass, Clock, Sun, Leaf, Lightbulb, Flag,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PoweredByBadge } from "@/components/brand/PoweredByBadge";
import {
  safeText, EmptyState, ComingSoon, cardStyle, mutedText, secondaryText, primaryText,
  SectionHeading, SubHeading, InfoRow, WeatherChart,
} from "./shared";

export function PlayItTab({ course }: { course: any }) {
  const insiderTips = Array.isArray(course.insiderTips) ? course.insiderTips : [];
  const practiceFacilities = Array.isArray(course.practiceFacilities) ? course.practiceFacilities : [];
  const bestMonths = Array.isArray(course.bestMonths) ? course.bestMonths : [];
  const worstMonths = Array.isArray(course.worstMonths) ? course.worstMonths : [];

  const hasGreenFees = course.greenFeeLow || course.greenFeeHigh || course.greenFeePeak || course.greenFeeOffPeak || course.greenFeeTwilight;
  const hasAccessInfo = safeText(course.howToGetOn) || safeText(course.resortAffiliateAccess) || safeText(course.guestPolicy);
  const hasPolicies = safeText(course.walkingPolicy) || safeText(course.dressCode) || safeText(course.paceOfPlayNotes) || safeText(course.cellPhonePolicy);
  const hasConditions = safeText(course.fairwayGrass) || safeText(course.greenGrass) || safeText(course.greenSpeed) || safeText(course.aerationSchedule) || safeText(course.golfSeason);
  const hasTimingInfo = safeText(course.bestTimeToPlay) || course.weatherData || safeText(course.bestConditionMonths);
  const hasStrategy = safeText(course.courseStrategy) || safeText(course.whatToExpect) || insiderTips.length > 0;
  const hasEquipment = safeText(course.caddieAvailability) || safeText(course.cartPolicy) || course.clubRentalAvailable != null;

  const hasAnyData = hasGreenFees || hasAccessInfo || hasPolicies || hasConditions || hasTimingInfo || hasStrategy || practiceFacilities.length > 0 || hasEquipment;

  if (!hasAnyData) {
    return (
      <div className="max-w-3xl">
        <section style={cardStyle}>
          <ComingSoon
            title="Playing information coming soon"
            description="Green fees, policies, strategy tips, and practical info are being gathered for this course"
          />
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">

      {/* Green Fee Breakdown */}
      {hasGreenFees && (
        <section style={cardStyle}>
          <SectionHeading icon={<DollarSign className="h-5 w-5" style={{ color: "#00E676" }} />}>
            Green Fees
          </SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {course.greenFeePeak && (
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)" }}>
                <div className="text-xs mb-1" style={mutedText}>Peak</div>
                <div className="text-xl font-bold" style={primaryText}>{formatCurrency(course.greenFeePeak)}</div>
              </div>
            )}
            {course.greenFeeOffPeak && (
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)" }}>
                <div className="text-xs mb-1" style={mutedText}>Off-Peak</div>
                <div className="text-xl font-bold" style={primaryText}>{formatCurrency(course.greenFeeOffPeak)}</div>
              </div>
            )}
            {course.greenFeeTwilight && (
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)" }}>
                <div className="text-xs mb-1" style={mutedText}>Twilight</div>
                <div className="text-xl font-bold" style={primaryText}>{formatCurrency(course.greenFeeTwilight)}</div>
              </div>
            )}
            {!course.greenFeePeak && !course.greenFeeOffPeak && !course.greenFeeTwilight && (course.greenFeeLow || course.greenFeeHigh) && (
              <div className="rounded-lg p-4 text-center col-span-full" style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)" }}>
                <div className="text-xs mb-1" style={mutedText}>Range</div>
                <div className="text-xl font-bold" style={primaryText}>
                  {formatCurrency(course.greenFeeLow)}{course.greenFeeHigh && course.greenFeeLow !== course.greenFeeHigh ? ` – ${formatCurrency(course.greenFeeHigh)}` : ""}
                </div>
              </div>
            )}
          </div>
          {course.includesCart != null && (
            <p className="text-xs mt-3 text-center" style={mutedText}>
              {course.includesCart ? "Cart included in green fee" : "Cart fee separate"}
            </p>
          )}
        </section>
      )}

      {/* How to Get On */}
      {hasAccessInfo && (
        <section style={cardStyle}>
          <SectionHeading icon={<Compass className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />} lastUpdated={course.updatedAt}>
            How to Get On
          </SectionHeading>
          {safeText(course.howToGetOn) && (
            <p className="text-sm leading-relaxed mb-4" style={secondaryText}>{safeText(course.howToGetOn)}</p>
          )}
          {safeText(course.resortAffiliateAccess) && (
            <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
              <span className="text-xs font-semibold" style={mutedText}>Resort / Affiliate Access</span>
              <p className="text-sm mt-1" style={primaryText}>{safeText(course.resortAffiliateAccess)}</p>
            </div>
          )}
          {safeText(course.guestPolicy) && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
              <span className="text-xs font-semibold" style={mutedText}>Guest Policy</span>
              <p className="text-sm mt-1" style={primaryText}>{safeText(course.guestPolicy)}</p>
            </div>
          )}
        </section>
      )}

      {/* Policies */}
      {(hasPolicies || hasEquipment) && (
        <section style={cardStyle}>
          <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
            Policies & Equipment
          </SectionHeading>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Walking Policy" value={safeText(course.walkingPolicy)} />
            <InfoRow label="Dress Code" value={safeText(course.dressCode)} />
            <InfoRow label="Cell Phone Policy" value={safeText(course.cellPhonePolicy)} />
            <InfoRow label="Avg Round Time" value={safeText(course.averageRoundTime)} />
            <InfoRow label="Caddie" value={
              safeText(course.caddieAvailability)
                ? `${safeText(course.caddieAvailability)}${safeText(course.caddieFee) ? ` — ${safeText(course.caddieFee)}` : ""}`
                : null
            } />
            <InfoRow label="Cart" value={
              safeText(course.cartPolicy)
                ? `${safeText(course.cartPolicy)}${safeText(course.cartFee) ? ` — ${safeText(course.cartFee)}` : ""}`
                : null
            } />
            <InfoRow label="Club Rental" value={course.clubRentalAvailable != null ? (course.clubRentalAvailable ? "Available" : "Not available") : null} />
          </dl>
          {safeText(course.paceOfPlayNotes) && (
            <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
              <span className="text-xs font-semibold" style={mutedText}>Pace of Play Notes</span>
              <p className="text-sm mt-1" style={secondaryText}>{safeText(course.paceOfPlayNotes)}</p>
            </div>
          )}
        </section>
      )}

      {/* Practice Facilities */}
      {practiceFacilities.length > 0 && (
        <section style={cardStyle}>
          <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
            Practice Facilities
          </SectionHeading>
          <div className="flex flex-wrap gap-2">
            {practiceFacilities.map((f: any, i: number) => {
              const label = typeof f === "string" ? f : (f.details || f.type || "Facility");
              return (
                <span key={i} className="rounded-full px-3 py-1.5 text-xs font-medium" style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-secondary)",
                  border: "1px solid var(--cg-border)",
                }}>
                  {label}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Best Time to Play & Weather */}
      {hasTimingInfo && (
        <section style={cardStyle}>
          <SectionHeading icon={<Sun className="h-5 w-5" style={{ color: "#fbbf24" }} />}>
            Best Time to Play
          </SectionHeading>
          {safeText(course.bestTimeToPlay) && (
            <p className="text-sm leading-relaxed mb-4" style={secondaryText}>{safeText(course.bestTimeToPlay)}</p>
          )}
          {safeText(course.bestConditionMonths) && (
            <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
              <span className="text-xs font-semibold" style={mutedText}>Best Condition Months</span>
              <p className="text-sm mt-1" style={primaryText}>{safeText(course.bestConditionMonths)}</p>
            </div>
          )}
          {bestMonths.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {bestMonths.map((m: string, i: number) => (
                <span key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: "rgba(0,230,118,0.15)", color: "#00E676", border: "1px solid rgba(0,230,118,0.3)" }}>
                  {m}
                </span>
              ))}
            </div>
          )}
          {worstMonths.length > 0 && (
            <div className="mb-4">
              <span className="text-xs font-medium" style={mutedText}>Avoid: </span>
              {worstMonths.map((m: string, i: number) => (
                <span key={i} className="text-xs" style={secondaryText}>{m}{i < worstMonths.length - 1 ? ", " : ""}</span>
              ))}
            </div>
          )}
          {course.weatherData && typeof course.weatherData === "object" && (
            <div>
              <SubHeading>Average Monthly Temperatures</SubHeading>
              <WeatherChart weatherData={course.weatherData} />
            </div>
          )}
        </section>
      )}

      {/* Course Conditions */}
      {hasConditions && (
        <section style={cardStyle}>
          <SectionHeading icon={<Leaf className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
            Course Conditions
          </SectionHeading>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Fairway Grass" value={safeText(course.fairwayGrass)} />
            <InfoRow label="Green Grass" value={safeText(course.greenGrass)} />
            <InfoRow label="Green Speed" value={safeText(course.greenSpeed)} />
            <InfoRow label="Aeration Schedule" value={safeText(course.aerationSchedule)} />
            <InfoRow label="Golf Season" value={safeText(course.golfSeason)} />
          </dl>
        </section>
      )}

      {/* Strategy Tips */}
      {hasStrategy && (
        <section style={cardStyle}>
          <SectionHeading icon={<Lightbulb className="h-5 w-5" style={{ color: "#fbbf24" }} />}>
            Strategy & Tips
          </SectionHeading>

          {safeText(course.courseStrategy) && (
            <div className="mb-4">
              <SubHeading>Course Strategy</SubHeading>
              <p className="text-sm leading-relaxed" style={secondaryText}>{safeText(course.courseStrategy)}</p>
            </div>
          )}

          {safeText(course.whatToExpect) && (
            <div className="mb-4">
              <SubHeading>What to Expect</SubHeading>
              <p className="text-sm leading-relaxed" style={secondaryText}>{safeText(course.whatToExpect)}</p>
            </div>
          )}

          {insiderTips.length > 0 && (
            <div>
              <SubHeading>Insider Tips</SubHeading>
              <ol className="space-y-3">
                {insiderTips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                    <span className="flex items-center justify-center h-6 w-6 rounded-full shrink-0 text-xs font-bold" style={{
                      backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24",
                    }}>
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed" style={secondaryText}>{tip}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {/* Strategy by Handicap — link to Readability tab */}
      <section style={cardStyle}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div
            className="flex items-center justify-center h-12 w-12 rounded-2xl mb-3"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <span style={{ color: "#4ade80" }}>🧠</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>Hole-by-Hole Strategy</p>
          <p className="mt-1 text-xs max-w-sm" style={{ color: "var(--cg-text-muted)" }}>
            Check the Readability tab for AI-powered, personalized hole-by-hole playing advice based on your handicap
          </p>
        </div>
      </section>

      <div className="flex justify-end">
        <PoweredByBadge variant="intelligence" />
      </div>
    </div>
  );
}
