"use client";

import { useState } from "react";
import {
  Plane, Utensils, Bed, Compass, Truck, Flag, Star, ChevronRight,
  Phone, ExternalLink, Sun, CloudRain, MapPin, Briefcase,
} from "lucide-react";
import {
  safeText, EmptyState, ComingSoon, cardStyle, mutedText, secondaryText, primaryText,
  SectionHeading, WeatherChart,
} from "./shared";

export function TravelStayTab({ course }: { course: any }) {
  const [subTab, setSubTab] = useState<string>("overview");

  const nearbyDining = course.nearbyDining || [];
  const nearbyLodging = course.nearbyLodging || [];
  const nearbyAttractions = course.nearbyAttractions || [];
  const nearbyRvParks = course.nearbyRvParks || [];
  const nearbyCourses = course.nearbyCourses || [];

  const poiSubTabs = [
    { key: "overview", label: "Overview", icon: <Plane className="h-4 w-4" /> },
    { key: "dining", label: "Dining", icon: <Utensils className="h-4 w-4" />, count: nearbyDining.length },
    { key: "lodging", label: "Lodging", icon: <Bed className="h-4 w-4" />, count: nearbyLodging.length },
    { key: "attractions", label: "Attractions", icon: <Compass className="h-4 w-4" />, count: nearbyAttractions.length },
    { key: "rv", label: "RV Parks", icon: <Truck className="h-4 w-4" />, count: nearbyRvParks.length },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {poiSubTabs.map((tab) => {
          const isActive = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0"
              style={{
                backgroundColor: isActive ? "rgba(74,222,128,0.15)" : "transparent",
                color: isActive ? "#4ade80" : "var(--cg-text-muted)",
                border: isActive ? "1px solid rgba(74,222,128,0.3)" : "1px solid transparent",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[10px] rounded-full px-1.5 py-0.5 ml-0.5" style={{
                  backgroundColor: isActive ? "rgba(74,222,128,0.2)" : "var(--cg-bg-tertiary)",
                  color: isActive ? "#4ade80" : "var(--cg-text-muted)",
                }}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Overview sub-tab ── */}
      {subTab === "overview" && (
        <div className="grid gap-8 lg:grid-cols-2">
          {!course.airports?.length && nearbyCourses.length === 0 &&
           nearbyLodging.length === 0 && nearbyDining.length === 0 &&
           nearbyAttractions.length === 0 && nearbyRvParks.length === 0 && (
            <div className="lg:col-span-2">
              <section style={cardStyle}>
                <EmptyState
                  icon={<Briefcase className="h-8 w-8" />}
                  title="Trip planning data being curated"
                  description="We're gathering airport proximity, lodging, dining, and attraction recommendations for this course"
                />
              </section>
            </div>
          )}

          {/* Left column */}
          <div className="space-y-8">
            {/* Map Placeholder */}
            <section style={cardStyle}>
              <SectionHeading icon={<MapPin className="h-5 w-5" style={{ color: "#00E676" }} />}>
                Location
              </SectionHeading>
              {course.latitude && course.longitude ? (
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "var(--cg-bg-tertiary)", height: 200, border: "1px solid var(--cg-border)" }}>
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2" style={{ color: "#00E676" }} />
                      <p className="text-xs" style={mutedText}>Interactive map coming soon</p>
                      <p className="text-[10px] mt-1" style={mutedText}>
                        {parseFloat(course.latitude).toFixed(4)}°N, {parseFloat(course.longitude).toFixed(4)}°W
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <ComingSoon title="Map coming soon" description="Location data will power an interactive map" />
              )}
              {course.streetAddress && (
                <p className="text-sm mt-3" style={secondaryText}>{course.streetAddress}</p>
              )}
              {(course.city || course.state || course.zipCode) && (
                <p className="text-xs" style={mutedText}>
                  {[course.city, course.state, course.zipCode].filter(Boolean).join(", ")}
                </p>
              )}
            </section>

            {/* Getting There - Airports */}
            {course.airports?.length > 0 && (
              <section style={cardStyle}>
                <SectionHeading icon={<Plane className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
                  Getting There
                </SectionHeading>
                <div className="space-y-3">
                  {course.airports.slice(0, 8).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                      <div>
                        <div className="font-medium text-sm" style={primaryText}>
                          {a.airport.iataCode ? `${a.airport.iataCode} — ` : ""}{a.airport.airportName}
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={mutedText}>
                          <span>{a.airport.airportType}</span>
                          {a.airport.hasFbo && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                              FBO
                            </span>
                          )}
                          {a.airport.fboNames && (
                            <span className="text-[10px]" style={mutedText}>{a.airport.fboNames}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm" style={secondaryText}>
                          {parseFloat(a.distanceMiles).toFixed(0)} mi
                        </div>
                        {a.driveTimeMinutes && <div className="text-xs" style={mutedText}>{a.driveTimeMinutes} min</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Nearby Courses */}
            {nearbyCourses.length > 0 && (
              <section style={cardStyle}>
                <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
                  Nearby Courses
                </SectionHeading>
                <div className="space-y-3">
                  {nearbyCourses.map((nc: any) => {
                    const nearby = nc.nearbyCourse;
                    if (!nearby) return null;
                    const img = nearby.media?.[0];
                    return (
                      <a
                        key={nc.id}
                        href={`/course/${nearby.courseId}`}
                        className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:opacity-90"
                        style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                      >
                        {img && (
                          <div className="h-14 w-20 rounded-md overflow-hidden shrink-0" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                            <img src={img.url} alt={nearby.courseName} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate" style={primaryText}>{nearby.courseName}</div>
                          {nearby.city && <div className="text-xs" style={mutedText}>{[nearby.city, nearby.state].filter(Boolean).join(", ")}</div>}
                        </div>
                        <div className="text-right shrink-0">
                          {nc.distanceMiles && <div className="text-sm font-medium" style={secondaryText}>{parseFloat(nc.distanceMiles).toFixed(0)} mi</div>}
                          {nc.driveTimeMinutes && <div className="text-xs" style={mutedText}>{nc.driveTimeMinutes} min</div>}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0" style={mutedText} />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Right column — quick glance cards */}
          <div className="space-y-8">
            {/* Weather Snapshot */}
            {course.weatherData && typeof course.weatherData === "object" && (
              <section style={cardStyle}>
                <SectionHeading icon={<Sun className="h-5 w-5" style={{ color: "#fbbf24" }} />}>
                  Weather Snapshot
                </SectionHeading>
                <WeatherChart weatherData={course.weatherData} />
                {safeText(course.bestConditionMonths) && (
                  <p className="text-xs mt-3" style={mutedText}>Best months: {course.bestConditionMonths}</p>
                )}
              </section>
            )}

            {/* Lodging preview */}
            {nearbyLodging.length > 0 && (
              <section style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <SectionHeading icon={<Bed className="h-5 w-5" style={{ color: "#c084fc" }} />}>
                    Where to Stay
                  </SectionHeading>
                  <button onClick={() => setSubTab("lodging")} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {nearbyLodging.slice(0, 3).map((lodge: any) => (
                    <div key={lodge.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate" style={primaryText}>{lodge.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {lodge.lodgingType && <span className="text-[10px]" style={mutedText}>{lodge.lodgingType}</span>}
                          {lodge.isOnSite && (
                            <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                              backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80",
                            }}>On-Site</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {lodge.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                            <span className="text-xs font-medium" style={primaryText}>{parseFloat(lodge.rating).toFixed(1)}</span>
                          </div>
                        )}
                        {lodge.priceTier && <div className="text-xs" style={{ color: "#fbbf24" }}>{lodge.priceTier}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dining preview */}
            {nearbyDining.length > 0 && (
              <section style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <SectionHeading icon={<Utensils className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
                    Where to Eat
                  </SectionHeading>
                  <button onClick={() => setSubTab("dining")} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {nearbyDining.slice(0, 3).map((dining: any) => (
                    <div key={dining.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate" style={primaryText}>{dining.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {dining.cuisineType && <span className="text-[10px]" style={mutedText}>{dining.cuisineType}</span>}
                          {dining.isOnSite && (
                            <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                              backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80",
                            }}>On-Site</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {dining.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                            <span className="text-xs font-medium" style={primaryText}>{parseFloat(dining.rating).toFixed(1)}</span>
                          </div>
                        )}
                        {dining.priceLevel && <div className="text-xs" style={{ color: "#fbbf24" }}>{dining.priceLevel}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Attractions preview */}
            {nearbyAttractions.length > 0 && (
              <section style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <SectionHeading icon={<Compass className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
                    What to Do
                  </SectionHeading>
                  <button onClick={() => setSubTab("attractions")} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {nearbyAttractions.slice(0, 3).map((attr: any) => (
                    <div key={attr.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate" style={primaryText}>{attr.name}</div>
                        {attr.category && <div className="text-[10px] mt-0.5" style={mutedText}>{attr.category}</div>}
                      </div>
                      {attr.distanceMiles && (
                        <span className="text-xs shrink-0" style={mutedText}>{parseFloat(attr.distanceMiles).toFixed(1)} mi</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ── Dining sub-tab ── */}
      {subTab === "dining" && (
        <div>
          {nearbyDining.length === 0 ? (
            <section style={cardStyle}>
              <EmptyState icon={<Utensils className="h-8 w-8" />} title="No dining data yet" description="Restaurant recommendations are being curated for this course" />
            </section>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {nearbyDining.map((dining: any) => (
                <div key={dining.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium text-sm" style={primaryText}>{dining.name}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {dining.cuisineType && (
                          <span className="text-[10px] rounded-full px-2 py-0.5" style={{
                            backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)",
                          }}>{dining.cuisineType}</span>
                        )}
                        {dining.isOnSite && (
                          <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                            backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)",
                          }}>On-Site</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {dining.priceLevel && <div className="text-sm" style={{ color: "#fbbf24" }}>{dining.priceLevel}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2 text-xs">
                    {dining.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                        <span style={primaryText}>{parseFloat(dining.rating).toFixed(1)}</span>
                      </span>
                    )}
                    {dining.distanceMiles && <span style={mutedText}>{parseFloat(dining.distanceMiles).toFixed(1)} mi</span>}
                  </div>
                  {dining.description && <p className="text-xs leading-relaxed" style={mutedText}>{dining.description}</p>}
                  {(dining.websiteUrl || dining.phone) && (
                    <div className="flex gap-3 mt-3">
                      {dining.websiteUrl && (
                        <a href={dining.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {dining.phone && (
                        <a href={`tel:${dining.phone}`} className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                          <Phone className="h-3 w-3" /> {dining.phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Lodging sub-tab ── */}
      {subTab === "lodging" && (
        <div>
          {nearbyLodging.length === 0 ? (
            <section style={cardStyle}>
              <EmptyState icon={<Bed className="h-8 w-8" />} title="No lodging data yet" description="Hotel and lodging recommendations are being curated for this course" />
            </section>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {nearbyLodging.map((lodge: any) => (
                <div key={lodge.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium text-sm" style={primaryText}>{lodge.name}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {lodge.lodgingType && (
                          <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                            backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)",
                          }}>{lodge.lodgingType}</span>
                        )}
                        {lodge.isOnSite && (
                          <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                            backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)",
                          }}>On-Site</span>
                        )}
                        {lodge.isPartner && (
                          <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                            backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)",
                          }}>Partner</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {lodge.priceTier && <div className="text-sm font-medium" style={{ color: "#fbbf24" }}>{lodge.priceTier}</div>}
                      {lodge.avgPricePerNight && <div className="text-xs" style={mutedText}>${lodge.avgPricePerNight}/night</div>}
                    </div>
                  </div>
                  {lodge.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                      <span className="text-xs font-medium" style={primaryText}>{parseFloat(lodge.rating).toFixed(1)}</span>
                      {lodge.distanceMiles && (
                        <span className="text-xs ml-2" style={mutedText}>{parseFloat(lodge.distanceMiles).toFixed(1)} mi away</span>
                      )}
                    </div>
                  )}
                  {lodge.description && <p className="text-xs leading-relaxed" style={mutedText}>{lodge.description}</p>}
                  {(lodge.websiteUrl || lodge.bookingUrl) && (
                    <div className="flex gap-2 mt-3">
                      {lodge.bookingUrl && (
                        <a href={lodge.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                          Book <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {lodge.websiteUrl && (
                        <a href={lodge.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Attractions sub-tab ── */}
      {subTab === "attractions" && (
        <div>
          {nearbyAttractions.length === 0 ? (
            <section style={cardStyle}>
              <EmptyState icon={<Compass className="h-8 w-8" />} title="No attractions data yet" description="Nearby attraction recommendations are being curated for this course" />
            </section>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {nearbyAttractions.map((attr: any) => (
                <div key={attr.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm" style={primaryText}>{attr.name}</div>
                      {attr.category && (
                        <span className="text-[10px] rounded-full px-2 py-0.5 mt-1 inline-block" style={{
                          backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)",
                        }}>{attr.category}</span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {attr.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                          <span className="text-xs font-medium" style={primaryText}>{parseFloat(attr.rating).toFixed(1)}</span>
                        </div>
                      )}
                      {attr.distanceMiles && <span className="text-xs" style={mutedText}>{parseFloat(attr.distanceMiles).toFixed(1)} mi</span>}
                    </div>
                  </div>
                  {attr.description && <p className="text-xs leading-relaxed mt-2" style={mutedText}>{attr.description}</p>}
                  {attr.websiteUrl && (
                    <a href={attr.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-3 hover:opacity-80" style={secondaryText}>
                      Learn more <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RV Parks sub-tab ── */}
      {subTab === "rv" && (
        <div>
          {nearbyRvParks.length === 0 ? (
            <section style={cardStyle}>
              <EmptyState icon={<Truck className="h-8 w-8" />} title="No RV park data yet" description="RV park recommendations are being curated for this course" />
            </section>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {nearbyRvParks.map((rv: any) => (
                <div key={rv.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium text-sm" style={primaryText}>{rv.name}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {rv.hookups && (
                          <span className="text-[10px] rounded-full px-2 py-0.5" style={{
                            backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)",
                          }}>{rv.hookups}</span>
                        )}
                        {rv.numSites && (
                          <span className="text-[10px]" style={mutedText}>{rv.numSites} sites</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {rv.priceLevel && <div className="text-sm" style={{ color: "#fbbf24" }}>{rv.priceLevel}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2 text-xs">
                    {rv.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                        <span style={primaryText}>{parseFloat(rv.rating).toFixed(1)}</span>
                      </span>
                    )}
                    {rv.distanceMiles && <span style={mutedText}>{parseFloat(rv.distanceMiles).toFixed(1)} mi</span>}
                    {rv.driveTimeMinutes && <span style={mutedText}>{rv.driveTimeMinutes} min drive</span>}
                  </div>
                  {rv.description && <p className="text-xs leading-relaxed" style={mutedText}>{rv.description}</p>}
                  {rv.amenities && (
                    <p className="text-xs leading-relaxed mt-1" style={secondaryText}>
                      <span className="font-medium">Amenities:</span> {rv.amenities}
                    </p>
                  )}
                  {(rv.websiteUrl || rv.phone) && (
                    <div className="flex gap-3 mt-3">
                      {rv.websiteUrl && (
                        <a href={rv.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {rv.phone && (
                        <a href={`tel:${rv.phone}`} className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                          <Phone className="h-3 w-3" /> {rv.phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
