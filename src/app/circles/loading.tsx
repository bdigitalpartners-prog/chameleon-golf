export default function CirclesLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--cg-border)" }} />
        <div className="h-4 w-64 rounded mt-2 animate-pulse" style={{ backgroundColor: "var(--cg-border)" }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 animate-pulse"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: "var(--cg-border)" }} />
              <div className="space-y-2">
                <div className="h-3 w-28 rounded" style={{ backgroundColor: "var(--cg-border)" }} />
                <div className="h-2 w-20 rounded" style={{ backgroundColor: "var(--cg-border)" }} />
              </div>
            </div>
            <div className="h-3 w-full rounded mb-2" style={{ backgroundColor: "var(--cg-border)" }} />
            <div className="h-3 w-2/3 rounded" style={{ backgroundColor: "var(--cg-border)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
