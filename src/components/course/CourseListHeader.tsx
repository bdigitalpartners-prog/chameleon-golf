"use client";

export function CourseListHeader({ showRank }: { showRank?: boolean }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider"
      style={{
        color: "var(--cg-text-muted)",
        borderBottom: "1px solid var(--cg-border)",
      }}
    >
      {showRank && <div className="w-8 text-center">#</div>}
      <div className="w-14 flex-shrink-0" /> {/* thumbnail */}
      <div className="min-w-0 flex-1">Course</div>
      <div className="hidden sm:block w-20 flex-shrink-0">Style</div>
      <div className="hidden md:block w-24 flex-shrink-0">Access</div>
      <div className="hidden lg:block w-40 flex-shrink-0">Architect</div>
      <div className="hidden lg:block w-12 text-center flex-shrink-0">Year</div>
      <div className="hidden sm:block w-20 text-right flex-shrink-0">Fee</div>
      <div className="w-20 text-right flex-shrink-0">Best Rank</div>
      <div className="w-8 text-center flex-shrink-0" title="Number of ranking lists">Lists</div>
    </div>
  );
}
