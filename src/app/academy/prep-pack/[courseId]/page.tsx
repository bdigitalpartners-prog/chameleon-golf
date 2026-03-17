"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

export default function PrepPackPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [prepPack, setPrepPack] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !params.courseId) return;
    fetch(`/api/academy/prep-pack/${params.courseId}`)
      .then((r) => r.json())
      .then((data) => setPrepPack(data.prepPack))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, params.courseId]);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academy/prep-pack/${params.courseId}`, { method: "POST" });
      const data = await res.json();
      setPrepPack(data.prepPack);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-gray-400">Please sign in to view your prep pack.</p>
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

  if (!prepPack) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-gray-400">Prep pack not found.</p>
      </div>
    );
  }

  const keyHoles = prepPack.keyHoles || [];
  const strategyTips = prepPack.strategyTips || [];
  const clubSuggestions = prepPack.clubSuggestions || [];
  const expectations = prepPack.expectations || {};

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-emerald-400 hover:underline mb-6 inline-block">
          &larr; Back
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{prepPack.course?.courseName || "Course Prep Pack"}</h1>
            <p className="text-gray-400">{prepPack.course?.city}, {prepPack.course?.state}</p>
          </div>
          <button
            onClick={handleRegenerate}
            className="border border-emerald-400 text-emerald-400 hover:bg-emerald-400/10 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Regenerate
          </button>
        </div>

        {keyHoles.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Key Holes</h2>
            <div className="space-y-3">
              {keyHoles.map((hole: any, i: number) => (
                <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {hole.holeNumber}
                    </span>
                    <h3 className="font-medium">{hole.description}</h3>
                  </div>
                  <p className="text-gray-400 text-sm">{hole.strategy}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {strategyTips.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Strategy Tips</h2>
            <div className="space-y-3">
              {strategyTips.map((tip: any, i: number) => (
                <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <p className="text-gray-300">{tip.tip}</p>
                  <p className="text-xs text-gray-600 mt-2 capitalize">{tip.source.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {clubSuggestions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Club Suggestions</h2>
            <div className="space-y-3">
              {clubSuggestions.map((cs: any, i: number) => (
                <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <h3 className="font-medium text-emerald-400 mb-1">{cs.situation}</h3>
                  <p className="text-gray-300 text-sm">{cs.suggestion}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {expectations && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">What to Expect</h2>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 space-y-4">
              {expectations.expectedScore && (
                <div>
                  <p className="text-gray-500 text-sm">Expected Score</p>
                  <p className="text-white">{expectations.expectedScore}</p>
                </div>
              )}
              {expectations.courseConditions && (
                <div>
                  <p className="text-gray-500 text-sm">Course Conditions</p>
                  <p className="text-white">{expectations.courseConditions}</p>
                </div>
              )}
              {expectations.paceOfPlay && (
                <div>
                  <p className="text-gray-500 text-sm">Pace of Play</p>
                  <p className="text-white">{expectations.paceOfPlay}</p>
                </div>
              )}
              {expectations.bestTimeToPlay && (
                <div>
                  <p className="text-gray-500 text-sm">Best Time to Play</p>
                  <p className="text-white">{expectations.bestTimeToPlay}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
