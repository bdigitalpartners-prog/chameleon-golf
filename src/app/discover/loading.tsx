export default function DiscoverLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="h-8 w-40 rounded animate-pulse" style={{ backgroundColor: "var(--cg-border)" }} />
        <div className="h-4 w-72 rounded mt-2 animate-pulse" style={{ backgroundColor: "var(--cg-border)" }} />
      </div>
      {/* Course recs skeleton */}
      <div className="mb-8">
        <div className="h-6 w-32 rounded mb-4 animate-pulse" style={{ backgroundColor: "var(--cg-border)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden animate-pulse"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div className="h-32" style={{ backgroundColor: "var(--cg-border)" }} />
              <div className="p-4 space-y-2">
                <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--cg-border)" }} />
                <div className="h-2 w-1/2 rounded" style={{ backgroundColor: "var(--cg-border)" }} />
                <div className="h-2 w-full rounded" style={{ backgroundColor: "var(--cg-border)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* People skeleton */}
      <div className="mb-8">
        <div className="h-6 w-48 rounded mb-4 animate-pulse" style={{ backgroundColor: "var(--cg-border)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 text-center animate-pulse"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div className="w-14 h-14 rounded-full mx-auto mb-2" style={{ backgroundColor: "var(--cg-border)" }} />
              <div className="h-3 w-20 rounded mx-auto mb-1" style={{ backgroundColor: "var(--cg-border)" }} />
              <div className="h-2 w-12 rounded mx-auto" style={{ backgroundColor: "var(--cg-border)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
