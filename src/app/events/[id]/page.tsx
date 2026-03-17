"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

export default function EventDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!session || !params.id) return;
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((data) => setEvent(data.event))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, params.id]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await fetch(`/api/events/${params.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "interested" }),
      });
      setEvent((e: any) => ({ ...e, isRegistered: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-gray-400">Please sign in to view event details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-gray-400">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-emerald-400 hover:underline mb-6 inline-block">
          &larr; Back to Events
        </button>

        {event.imageUrl && (
          <div className="relative h-64 rounded-xl overflow-hidden mb-8">
            <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
        <div className="flex flex-wrap gap-3 mb-6">
          {event.format && (
            <span className="bg-emerald-400/20 text-emerald-400 px-3 py-1 rounded-full text-sm">{event.format}</span>
          )}
          {event.city && event.state && (
            <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">{event.city}, {event.state}</span>
          )}
          {event.price && (
            <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">${Number(event.price).toFixed(0)}</span>
          )}
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-500 text-sm">Date</p>
              <p className="text-white">{new Date(event.eventDate).toLocaleDateString()}</p>
            </div>
            {event.courseName && (
              <div>
                <p className="text-gray-500 text-sm">Course</p>
                <p className="text-white">{event.courseName}</p>
              </div>
            )}
            {event.maxHandicap && (
              <div>
                <p className="text-gray-500 text-sm">Max Handicap</p>
                <p className="text-white">{Number(event.maxHandicap)}</p>
              </div>
            )}
            {event.minHandicap && (
              <div>
                <p className="text-gray-500 text-sm">Min Handicap</p>
                <p className="text-white">{Number(event.minHandicap)}</p>
              </div>
            )}
          </div>

          {event.description && <p className="text-gray-300">{event.description}</p>}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleRegister}
            disabled={registering || event.isRegistered}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {event.isRegistered ? "Registered" : registering ? "Registering..." : "Register Interest"}
          </button>
          {event.registrationUrl && (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-emerald-400 text-emerald-400 hover:bg-emerald-400/10 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              External Registration
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
