"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Users,
  Star,
  MessageCircle,
  DollarSign,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface DashboardData {
  totalCourses: number;
  totalUsers: number;
  totalRatings: number;
  todayConciergeQueries: number;
  todayConciergeCost: number;
  recentUsers: Array<{ id: string; name: string | null; email: string; createdAt: string }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard", {
      headers: { "x-admin-key": localStorage.getItem("golfEQ_admin_key") || "" },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Total Courses"
          value={data?.totalCourses?.toLocaleString() || "0"}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Users"
          value={data?.totalUsers?.toLocaleString() || "0"}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Total Reviews"
          value={data?.totalRatings?.toLocaleString() || "0"}
        />
        <StatCard
          icon={<MessageCircle className="h-5 w-5" />}
          label="Today's Concierge"
          value={`${data?.todayConciergeQueries || 0} queries`}
          sub={`$${(data?.todayConciergeCost || 0).toFixed(4)}`}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <QuickAction icon={<Plus className="h-4 w-4" />} label="Add Course" onClick={() => router.push("/admin/courses/new")} />
          <QuickAction icon={<MapPin className="h-4 w-4" />} label="Manage Courses" onClick={() => router.push("/admin/courses")} />
          <QuickAction icon={<MessageCircle className="h-4 w-4" />} label="Concierge Settings" onClick={() => router.push("/admin/concierge")} />
          <QuickAction icon={<DollarSign className="h-4 w-4" />} label="Cost Dashboard" onClick={() => router.push("/admin/concierge")} />
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1f1f1f" }}>
          <h2 className="text-sm font-semibold text-white">Recent Signups</h2>
          <button
            onClick={() => router.push("/admin/users")}
            className="text-xs flex items-center gap-1 hover:underline"
            style={{ color: "#22c55e" }}
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: "#1f1f1f" }}>
          {data?.recentUsers && data.recentUsers.length > 0 ? (
            data.recentUsers.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{u.name || u.email}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-gray-500">No recent signups</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div style={{ color: "#22c55e" }}>{icon}</div>
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "#22c55e" }}>{sub}</div>}
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
      style={{
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        color: "#22c55e",
        border: "1px solid rgba(34, 197, 94, 0.2)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
