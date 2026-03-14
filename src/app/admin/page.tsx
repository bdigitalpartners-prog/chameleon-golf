"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, Trophy, BarChart3, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AdminPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "scores">("stats");

  const isAdmin = (session?.user as any)?.role === "admin";

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await fetch("/api/admin/stats")).json(),
    enabled: isAdmin,
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await fetch("/api/admin/users")).json(),
    enabled: isAdmin && activeTab === "users",
  });

  const { data: pendingScores } = useQuery({
    queryKey: ["admin-pending-scores"],
    queryFn: async () => (await fetch("/api/scores")).json(),
    enabled: isAdmin && activeTab === "scores",
  });

  const recomputeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chameleon-score", { method: "POST" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
  });

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Shield className="mx-auto h-16 w-16 text-stone-300" />
        <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">Admin Dashboard</h1>
        <p className="mt-2 text-stone-500">You need admin access to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-stone-900">Admin Dashboard</h1>
        <button
          onClick={() => recomputeMutation.mutate()}
          disabled={recomputeMutation.isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {recomputeMutation.isPending ? "Computing..." : "Recompute Scores"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-stone-100 p-1 mb-8 w-fit">
        {[
          { key: "stats", label: "Stats", icon: BarChart3 },
          { key: "users", label: "Users", icon: Users },
          { key: "scores", label: "Verification", icon: Trophy },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === "stats" && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Total Courses", value: stats.totalCourses?.toLocaleString(), color: "text-brand-600" },
            { label: "Enriched Courses", value: stats.enrichedCourses?.toLocaleString(), color: "text-blue-600" },
            { label: "Ranked Courses", value: stats.rankedCourses?.toLocaleString(), color: "text-amber-600" },
            { label: "Total Users", value: stats.totalUsers?.toLocaleString(), color: "text-purple-600" },
            { label: "Posted Scores", value: stats.totalScores?.toLocaleString(), color: "text-green-600" },
            { label: "Course Ratings", value: stats.totalRatings?.toLocaleString(), color: "text-rose-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="text-sm font-medium text-stone-500">{s.label}</div>
              <div className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && users && (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-600">Name</th>
                <th className="px-4 py-3 font-medium text-stone-600">Email</th>
                <th className="px-4 py-3 font-medium text-stone-600">Role</th>
                <th className="px-4 py-3 font-medium text-stone-600">Ratings</th>
                <th className="px-4 py-3 font-medium text-stone-600">Scores</th>
                <th className="px-4 py-3 font-medium text-stone-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">{u.name || "—"}</td>
                  <td className="px-4 py-3 text-stone-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{u._count?.ratings ?? 0}</td>
                  <td className="px-4 py-3 text-stone-600">{u._count?.scores ?? 0}</td>
                  <td className="px-4 py-3 text-stone-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Scores/Verification Tab */}
      {activeTab === "scores" && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <p className="text-stone-500">Score verification queue will populate as users submit scores with GHIN screenshots.</p>
        </div>
      )}
    </div>
  );
}
