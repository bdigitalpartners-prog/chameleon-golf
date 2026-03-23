"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Dna,
  CloudSun,
  Trophy,
  Footprints,
  TrendingUp,
  Satellite,
  Video,
  GitCompare,
  Lock,
} from "lucide-react";
import { UpgradePrompt } from "@/components/membership/UpgradePrompt";

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredTier?: "pro" | "elite" | "founders";
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "dna", label: "DNA", icon: Dna, requiredTier: "pro" },
  { id: "conditions", label: "Conditions", icon: CloudSun, requiredTier: "pro" },
  { id: "tournaments", label: "Tournaments", icon: Trophy },
  { id: "walking", label: "Walking", icon: Footprints, requiredTier: "pro" },
  { id: "betting", label: "Betting", icon: TrendingUp, requiredTier: "elite" },
  { id: "satellite", label: "Satellite", icon: Satellite, requiredTier: "elite" },
  { id: "creators", label: "Creators", icon: Video, requiredTier: "pro" },
  { id: "compare", label: "Compare", icon: GitCompare },
];

interface CourseDetailTabsProps {
  course: any;
  userTier?: string;
  children?: React.ReactNode;
}

export function CourseDetailTabs({ course, userTier = "free" }: CourseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const tierRank: Record<string, number> = { free: 0, pro: 1, elite: 2, founders: 3 };
  const userRank = tierRank[userTier] ?? 0;

  const hasAccess = (tab: Tab) => {
    if (!tab.requiredTier) return true;
    return userRank >= (tierRank[tab.requiredTier] ?? 0);
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div
        className="flex gap-1 overflow-x-auto pb-1 mb-6 -mx-1 px-1"
        style={{ borderBottom: "1px solid #222" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const locked = !hasAccess(tab);
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all rounded-t-lg relative"
              style={{
                color: active ? "#00FF85" : locked ? "#444" : "#999",
                backgroundColor: active ? "#00FF8510" : "transparent",
                borderBottom: active ? "2px solid #00FF85" : "2px solid transparent",
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {locked && <Lock className="w-3 h-3 ml-1" />}
              {tab.requiredTier === "elite" && !locked && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                  ELITE
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="text-gray-300 text-sm">
            <p className="text-gray-400">
              Course overview and intelligence data are displayed in the main course detail sections above.
            </p>
          </div>
        )}

        {activeTab === "dna" && (
          hasAccess(TABS.find((t) => t.id === "dna")!) ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Course DNA Fingerprint</h3>
              <p className="text-sm text-gray-400">
                Detailed design DNA and character analysis for {course?.courseName || "this course"}.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["Strategic", "Scenic", "Challenging", "Traditional", "Walkable", "Well-Conditioned"].map((trait) => (
                  <div key={trait} className="rounded-lg p-3" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
                    <p className="text-sm font-medium text-white">{trait}</p>
                    <div className="w-full h-2 rounded-full bg-gray-800 mt-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.floor(Math.random() * 40) + 60}%`, backgroundColor: "#00FF85" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <UpgradePrompt tier="pro" feature="Course DNA Fingerprint" />
          )
        )}

        {activeTab === "conditions" && (
          hasAccess(TABS.find((t) => t.id === "conditions")!) ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Live Conditions</h3>
              <p className="text-sm text-gray-400">
                Real-time course conditions and maintenance data for {course?.courseName || "this course"}.
              </p>
            </div>
          ) : (
            <UpgradePrompt tier="pro" feature="Live Conditions Layer" />
          )
        )}

        {activeTab === "tournaments" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Tournament History</h3>
            <p className="text-sm text-gray-400">
              Professional and amateur tournament history for {course?.courseName || "this course"}.
            </p>
          </div>
        )}

        {activeTab === "walking" && (
          hasAccess(TABS.find((t) => t.id === "walking")!) ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Walking & Accessibility</h3>
              <p className="text-sm text-gray-400">
                Walking friendliness ratings and accessibility information.
              </p>
            </div>
          ) : (
            <UpgradePrompt tier="pro" feature="Walking & Accessibility Guide" />
          )
        )}

        {activeTab === "betting" && (
          hasAccess(TABS.find((t) => t.id === "betting")!) ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Betting & DFS Intelligence</h3>
              <p className="text-sm text-gray-400">
                Course-player fit analytics, historical performance, and DFS projections.
              </p>
            </div>
          ) : (
            <UpgradePrompt tier="elite" feature="Betting & DFS Intelligence" />
          )
        )}

        {activeTab === "satellite" && (
          hasAccess(TABS.find((t) => t.id === "satellite")!) ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Satellite Feature Analysis</h3>
              <p className="text-sm text-gray-400">
                Aerial imagery analysis of course features, hazards, and layout.
              </p>
            </div>
          ) : (
            <UpgradePrompt tier="elite" feature="Satellite Feature Analysis" />
          )
        )}

        {activeTab === "creators" && (
          hasAccess(TABS.find((t) => t.id === "creators")!) ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Creator Content</h3>
              <p className="text-sm text-gray-400">
                Reviews, vlogs, and content from golf creators who have played this course.
              </p>
            </div>
          ) : (
            <UpgradePrompt tier="pro" feature="Creator Content" />
          )
        )}

        {activeTab === "compare" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Compare Courses</h3>
            <p className="text-sm text-gray-400">
              Compare {course?.courseName || "this course"} side-by-side with similar courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
