"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AcademyPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState<any[]>([]);
  const [prepPacks, setPrepPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!session) return;
    const params = category ? `?category=${category}` : "";
    Promise.all([
      fetch(`/api/academy/content${params}`).then((r) => r.json()),
      fetch("/api/academy/prep-pack").then((r) => r.json()),
    ])
      .then(([contentData, packData]) => {
        setContent(contentData.content || []);
        setPrepPacks(packData.prepPacks || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, category]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-gray-400">Please sign in to access the EQ Academy.</p>
      </div>
    );
  }

  const categories = ["course_strategy", "mental_game", "course_management", "scoring", "equipment"];

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">EQ Academy</h1>
        <p className="text-gray-400 mb-8">Master course intelligence and elevate your game with personalized prep packs.</p>

        {prepPacks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Your Prep Packs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prepPacks.map((pack: any) => (
                <a
                  key={pack.id}
                  href={`/academy/prep-pack/${pack.courseId}`}
                  className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-emerald-400/50 transition-colors"
                >
                  <h3 className="font-medium text-white mb-1">{pack.course?.courseName || "Course"}</h3>
                  <p className="text-sm text-gray-500">{pack.course?.city}, {pack.course?.state}</p>
                  <p className="text-xs text-gray-600 mt-2">Generated {new Date(pack.generatedAt).toLocaleDateString()}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-4">Academy Content</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategory("")}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${!category ? "bg-emerald-500 text-white" : "bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600"}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors capitalize ${category === cat ? "bg-emerald-500 text-white" : "bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600"}`}
              >
                {cat.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-400" />
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl mb-2">No content yet</p>
              <p>Academy content is coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item: any) => (
                <div key={item.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-400/50 transition-colors">
                  {item.heroImage && <img src={item.heroImage} alt={item.title} className="w-full h-40 object-cover" />}
                  <div className="p-5">
                    <div className="flex gap-2 mb-2">
                      {item.category && <span className="text-xs text-emerald-400 capitalize">{item.category.replace(/_/g, " ")}</span>}
                      {item.difficulty && <span className="text-xs text-gray-500">{item.difficulty}</span>}
                    </div>
                    <h3 className="font-medium text-white mb-1">{item.title}</h3>
                    {item.subtitle && <p className="text-sm text-gray-400 line-clamp-2">{item.subtitle}</p>}
                    {item.estimatedTime && <p className="text-xs text-gray-600 mt-3">{item.estimatedTime}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
