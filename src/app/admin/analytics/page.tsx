"use client";

import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BarChart3 className="h-12 w-12 text-gray-600 mb-4" />
      <h1 className="text-xl font-bold text-white mb-2">Analytics</h1>
      <p className="text-sm text-gray-500">Analytics dashboard coming soon.</p>
    </div>
  );
}
