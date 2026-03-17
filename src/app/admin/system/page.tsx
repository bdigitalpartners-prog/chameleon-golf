"use client";

import { Settings } from "lucide-react";

export default function SystemPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Settings className="h-12 w-12 text-gray-600 mb-4" />
      <h1 className="text-xl font-bold text-white mb-2">System</h1>
      <p className="text-sm text-gray-500">System settings coming soon.</p>
    </div>
  );
}
