"use client";

import { Star } from "lucide-react";

export default function ReviewsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Star className="h-12 w-12 text-gray-600 mb-4" />
      <h1 className="text-xl font-bold text-white mb-2">Reviews</h1>
      <p className="text-sm text-gray-500">Review moderation coming soon.</p>
    </div>
  );
}
