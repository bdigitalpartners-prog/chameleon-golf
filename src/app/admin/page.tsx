"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { MapPin, Users, Star, MessageCircle, DollarSign, Plus, CheckCircle, ArrowRight } from "lucide-react";

interface DashboardData {
  totalCourses: number;
  totalUsers: number;
  totalRatings: number;
  todayConciergeQueries: number;
  todayConciergeCost: number;
  recentUsers: Array<{ id: string; name: string | null; email: string | null; createdAt: string }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard", {
      headers: { "x-admin-key": sessionStorage.getItem("golfEQ_admin_key") || "" },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">GolfEQ platform overview</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Total Courses"
          value={data?.totalCourses?.toLocaleString() || "0"}
          color="text-green-500"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Users"
          value={data?.totalUsers?.toLocaleString() || "0"}
          color="text-blue-500"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Total Ratings"
          value={data?.totalRatings?.toLocaleString() || "0"}
          color="text-amber-500"
        />
        <StatCard
          icon={<MessageCircle className="h-5 w-5" />}
          label="Today's Concierge"
          value={`${data?.todayConciergeQueries || 0} queries`}
          subtitle={`$${(data?.todayConciergeCost || 0).toFixed(4)} cost`}
          color="text-purple-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/admin/courses/new" icon={<Plus className="h-4 w-4" />} label="Add Course" />
          <QuickAction href="/admin/courses/import" icon={<ArrowRight className="h-4 w-4" />} label="Bulk Import" />
          <QuickAction href="/admin/concierge" icon={<DollarSign className="h-4 w-4" />} label="Concierge Costs" />
          <QuickAction href="/admin/courses" icon={<CheckCircle className="h-4 w-4" />} label="Manage Courses" />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Recent Signups</h2>
        <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentUsers?.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-white">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!data?.recentUsers || data.recentUsers.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className={color}>{icon}</div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-green-500/30 hover:bg-green-500/5 hover:text-green-500"
    >
      {icon}
      {label}
    </a>
  );
}
