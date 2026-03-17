"use client";

interface PrepPackCardProps {
  prepPack: {
    id: string;
    courseId: number;
    generatedAt: string;
    course?: { courseId: number; courseName: string; city?: string; state?: string };
    keyHoles?: any[];
    strategyTips?: any[];
  };
}

export default function PrepPackCard({ prepPack }: PrepPackCardProps) {
  const keyHoleCount = prepPack.keyHoles?.length || 0;
  const tipCount = prepPack.strategyTips?.length || 0;

  return (
    <a
      href={`/academy/prep-pack/${prepPack.courseId}`}
      className="block bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-emerald-400/50 transition-colors"
    >
      <h3 className="font-medium text-white mb-1">{prepPack.course?.courseName || "Course Prep Pack"}</h3>
      {prepPack.course?.city && (
        <p className="text-sm text-gray-500 mb-3">
          {prepPack.course.city}{prepPack.course.state ? `, ${prepPack.course.state}` : ""}
        </p>
      )}

      <div className="flex gap-4 text-xs text-gray-500">
        {keyHoleCount > 0 && <span>{keyHoleCount} key holes</span>}
        {tipCount > 0 && <span>{tipCount} tips</span>}
      </div>

      <p className="text-xs text-gray-600 mt-3">
        Generated {new Date(prepPack.generatedAt).toLocaleDateString()}
      </p>
    </a>
  );
}
