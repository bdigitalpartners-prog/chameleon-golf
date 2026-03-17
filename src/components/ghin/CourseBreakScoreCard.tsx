'use client';

import { useState, useEffect } from 'react';
import { Target, Trophy, Medal, Award, ChevronRight, Loader2 } from 'lucide-react';

interface CourseRecommendation {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  location: string;
  par: number | null;
  accessType: string | null;
  trueDifficultyIndex: number;
  slopeRating: number | null;
  courseRating: number | null;
  expectedScore: number | null;
  matchQuality: number;
  canBreak80: boolean | null;
  canBreak90: boolean | null;
  canBreak100: boolean | null;
}

type BreakTarget = 80 | 90 | 100;

const BREAK_CONFIGS: { target: BreakTarget; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  { target: 80, label: 'Break 80', icon: <Trophy className="w-5 h-5" />, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  { target: 90, label: 'Break 90', icon: <Medal className="w-5 h-5" />, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { target: 100, label: 'Break 100', icon: <Award className="w-5 h-5" />, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
];

export default function CourseBreakScoreCard() {
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<BreakTarget>(90);
  const [handicapIndex, setHandicapIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch(`/api/courses/recommendations/handicap?targetScore=${selectedTarget}&limit=10`);
        if (!res.ok) {
          if (res.status === 401) return;
          if (res.status === 400) {
            setError('Connect your GHIN number to see personalized course recommendations.');
            return;
          }
          throw new Error('Failed to fetch recommendations');
        }
        const data = await res.json();
        setCourses(data.recommendations || []);
        setHandicapIndex(data.handicapIndex);
      } catch {
        setError('Unable to load course recommendations');
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [selectedTarget]);

  const getBreakField = (course: CourseRecommendation): boolean | null => {
    if (selectedTarget === 80) return course.canBreak80;
    if (selectedTarget === 90) return course.canBreak90;
    return course.canBreak100;
  };

  const selectedConfig = BREAK_CONFIGS.find((c) => c.target === selectedTarget)!;

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[var(--cg-bg-card,#1a1a1a)] p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[var(--cg-bg-card,#1a1a1a)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-[var(--cg-accent,#22c55e)]" />
          <h3 className="text-lg font-semibold text-[var(--cg-text-primary,#ffffff)]">
            Courses Where You&apos;ll Break Your Target
          </h3>
        </div>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-[var(--cg-bg-card,#1a1a1a)] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Target className="w-5 h-5 text-[var(--cg-accent,#22c55e)]" />
        <h3 className="text-lg font-semibold text-[var(--cg-text-primary,#ffffff)]">
          Courses Where You&apos;ll Break Your Target
        </h3>
      </div>
      {handicapIndex !== null && (
        <p className="text-sm text-gray-400 mb-5">
          Based on your {handicapIndex.toFixed(1)} handicap index
        </p>
      )}

      {/* Target Selector */}
      <div className="flex gap-2 mb-6">
        {BREAK_CONFIGS.map((config) => (
          <button
            key={config.target}
            onClick={() => {
              setLoading(true);
              setSelectedTarget(config.target);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTarget === config.target
                ? `${config.bgColor} ${config.color} border border-current/20`
                : 'bg-[var(--cg-bg-primary,#111111)] text-gray-400 border border-gray-800 hover:text-gray-300'
            }`}
          >
            {config.icon}
            {config.label}
          </button>
        ))}
      </div>

      {/* Course List */}
      {courses.length === 0 ? (
        <div className="text-center py-8">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${selectedConfig.bgColor} mb-3`}>
            {selectedConfig.icon}
          </div>
          <p className="text-sm text-gray-400">
            No courses found where you can break {selectedTarget} at your current handicap.
            <br />
            Keep practicing and check back as your handicap improves!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.courseId}
              className="flex items-center justify-between p-4 rounded-lg bg-[var(--cg-bg-primary,#111111)] border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-[var(--cg-text-primary,#ffffff)] truncate">
                    {course.courseName}
                  </h4>
                  {getBreakField(course) && (
                    <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedConfig.bgColor} ${selectedConfig.color}`}>
                      {selectedConfig.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{course.location}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  {course.slopeRating && (
                    <span>Slope: {course.slopeRating}</span>
                  )}
                  {course.courseRating && (
                    <span>Rating: {course.courseRating.toFixed(1)}</span>
                  )}
                  {course.expectedScore && (
                    <span className={selectedConfig.color}>
                      Expected: {course.expectedScore}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Match</p>
                  <p className="text-sm font-bold text-[var(--cg-text-primary,#ffffff)]">
                    {course.matchQuality}%
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
