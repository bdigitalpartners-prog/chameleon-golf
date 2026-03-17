"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EventCard from "@/components/events/EventCard";

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: "", format: "", maxPrice: "" });

  useEffect(() => {
    if (!session) return;
    const params = new URLSearchParams();
    if (filters.state) params.set("state", filters.state);
    if (filters.format) params.set("format", filters.format);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

    fetch(`/api/events?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, filters]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-gray-400">Please sign in to view events.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">EQ Events Discovery</h1>
        <p className="text-gray-400 mb-8">Find golf events matched to your skill level and preferences.</p>

        <div className="flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            placeholder="State..."
            value={filters.state}
            onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
          />
          <select
            value={filters.format}
            onChange={(e) => setFilters((f) => ({ ...f, format: e.target.value }))}
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
          >
            <option value="">All Formats</option>
            <option value="stroke">Stroke Play</option>
            <option value="match">Match Play</option>
            <option value="scramble">Scramble</option>
            <option value="best_ball">Best Ball</option>
          </select>
          <input
            type="number"
            placeholder="Max price..."
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none w-36"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl mb-2">No events found</p>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
