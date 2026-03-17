"use client";

import {
  Calendar, Star, Trophy, Clock, Pencil,
} from "lucide-react";
import {
  safeText, ComingSoon, cardStyle, mutedText, secondaryText, primaryText,
  SectionHeading, SubHeading, tierBadgeStyle,
} from "./shared";

export function HistoryTab({ course }: { course: any }) {
  const championshipHistory = Array.isArray(course.championshipHistory) ? course.championshipHistory : [];
  const famousMoments = Array.isArray(course.famousMoments) ? course.famousMoments : [];
  const upcomingEvents = Array.isArray(course.upcomingEvents) ? course.upcomingEvents : [];
  const renovationHistory = Array.isArray(course.renovationHistory) ? course.renovationHistory : [];
  const rankings = course.rankings || [];

  const hasHistory = championshipHistory.length > 0 || famousMoments.length > 0 || upcomingEvents.length > 0;
  const hasRenovation = renovationHistory.length > 0 || safeText(course.renovationArchitect);
  const hasRankings = rankings.length > 0;

  if (!hasHistory && !hasRenovation && !hasRankings && !safeText(course.description)) {
    return (
      <div className="max-w-3xl">
        <section style={cardStyle}>
          <ComingSoon
            title="Course history coming soon"
            description="Tournament history, notable moments, and legacy information are being compiled for this course"
          />
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">

      {/* Tournament / Championship History Timeline */}
      {championshipHistory.length > 0 && (
        <section style={cardStyle}>
          <SectionHeading icon={<Trophy className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
            Championship History
          </SectionHeading>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: "var(--cg-border)" }} />
            {championshipHistory.sort((a: any, b: any) => (b.year || 0) - (a.year || 0)).map((evt: any, i: number) => (
              <div key={i} className="relative">
                <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full" style={{ backgroundColor: "#f59e0b", border: "2px solid var(--cg-bg-card)" }} />
                <div className="rounded-lg p-4" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-bold tabular-nums" style={{ color: "#f59e0b" }}>{evt.year}</span>
                    <span className="text-sm font-medium" style={primaryText}>{evt.event}</span>
                  </div>
                  {evt.winner && <div className="text-xs" style={secondaryText}>Winner: {evt.winner}</div>}
                  {evt.score && <div className="text-xs" style={mutedText}>Score: {evt.score}</div>}
                  {evt.notes && <p className="text-xs mt-1" style={mutedText}>{evt.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notable Moments */}
      {famousMoments.length > 0 && (
        <section style={cardStyle}>
          <SectionHeading icon={<Star className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
            Notable Moments
          </SectionHeading>
          <ul className="space-y-3">
            {famousMoments.map((moment: any, i: number) => {
              const text = typeof moment === "string" ? moment : (moment.year ? `${moment.year}: ${moment.description}` : moment.description || String(moment));
              return (
                <li key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                  <Star className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                  <span className="text-sm leading-relaxed" style={secondaryText}>{text}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section style={cardStyle}>
          <SectionHeading icon={<Calendar className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
            Upcoming Events
          </SectionHeading>
          <div className="space-y-3">
            {upcomingEvents.map((evt: any, i: number) => (
              <div key={i} className="flex items-start gap-4 rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                <div>
                  <div className="font-medium text-sm" style={primaryText}>{evt.event || evt.name || "Event"}</div>
                  {evt.date && <div className="text-xs mt-0.5" style={mutedText}>{evt.date}</div>}
                  {evt.description && <p className="text-xs mt-1" style={secondaryText}>{evt.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historical Significance */}
      {safeText(course.description) && (
        <section style={cardStyle}>
          <SectionHeading icon={<Clock className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
            Historical Significance
          </SectionHeading>
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={secondaryText}>{safeText(course.description)}</p>
            {course.yearOpened && (
              <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                <span className="text-xs font-semibold" style={mutedText}>Established</span>
                <p className="text-lg font-bold mt-0.5" style={primaryText}>{course.yearOpened}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Year-by-Year Ranking History */}
      {hasRankings && (
        <section style={cardStyle}>
          <SectionHeading icon={<Trophy className="h-5 w-5" style={{ color: "#00E676" }} />}>
            Ranking History
          </SectionHeading>
          <div className="space-y-2">
            {(() => {
              const bySource: Record<string, any[]> = {};
              rankings.forEach((r: any) => {
                const src = r.list?.source?.sourceName || "Other";
                if (!bySource[src]) bySource[src] = [];
                bySource[src].push(r);
              });
              return Object.entries(bySource).map(([source, entries]) => (
                <div key={source} className="mb-4">
                  <SubHeading>{source}</SubHeading>
                  <div className="space-y-2">
                    {entries.sort((a: any, b: any) => (b.list?.yearPublished || 0) - (a.list?.yearPublished || 0)).map((r: any) => (
                      <div key={r.entryId} className="flex items-center justify-between rounded-lg px-4 py-2" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold tabular-nums text-sm" style={{ color: "#00E676" }}>
                            {r.rankPosition != null ? `#${r.rankPosition}` : "NR"}
                          </span>
                          <span className="text-sm" style={secondaryText}>{r.list?.listName}</span>
                          {r.list?.prestigeTier && (
                            <span className="rounded px-1.5 py-0.5 text-[10px] capitalize font-medium" style={tierBadgeStyle(r.list.prestigeTier)}>
                              {r.list.prestigeTier}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {r.list?.yearPublished && (
                            <span className="text-xs tabular-nums" style={mutedText}>{r.list.yearPublished}</span>
                          )}
                          {r.rankChange != null && r.rankChange !== 0 && (
                            <span className="text-xs font-medium" style={{ color: r.rankChange > 0 ? "#2ECC71" : "#ef4444" }}>
                              {r.rankChange > 0 ? `▲${r.rankChange}` : `▼${Math.abs(r.rankChange)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* Renovation Timeline */}
      {hasRenovation && (
        <section style={cardStyle}>
          <SectionHeading icon={<Pencil className="h-5 w-5" style={{ color: "#c084fc" }} />}>
            Renovation Timeline
          </SectionHeading>
          {renovationHistory.length > 0 ? (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: "var(--cg-border)" }} />
              {renovationHistory.map((item: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full" style={{ backgroundColor: "#c084fc", border: "2px solid var(--cg-bg-card)" }} />
                  <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      {item.year && <span className="text-sm font-bold" style={{ color: "#c084fc" }}>{item.year}</span>}
                      {item.architect && <span className="text-xs" style={mutedText}>by {item.architect}</span>}
                    </div>
                    {item.description && <p className="text-sm" style={secondaryText}>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg p-4" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
              {course.renovationYear && <span className="text-sm font-bold" style={{ color: "#c084fc" }}>{course.renovationYear}</span>}
              {safeText(course.renovationArchitect) && (
                <p className="text-sm" style={secondaryText}>Renovated by {course.renovationArchitect}</p>
              )}
              {safeText(course.renovationNotes) && (
                <p className="text-xs mt-1" style={mutedText}>{course.renovationNotes}</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Photo Gallery */}
      {course.media?.length > 1 && (
        <section style={cardStyle}>
          <SectionHeading icon={<Calendar className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>Photos Through the Years</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {course.media.slice(0, 9).map((m: any) => (
              <div key={m.mediaId} className="aspect-[4/3] overflow-hidden rounded-lg" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                <img
                  src={m.url}
                  alt={m.caption || course.courseName}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
