"use client";

import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Users className="h-12 w-12 text-gray-600 mb-4" />
      <h1 className="text-xl font-bold text-white mb-2">Users</h1>
      <p className="text-sm text-gray-500">User management coming soon.</p>
    </div>
  );
}
