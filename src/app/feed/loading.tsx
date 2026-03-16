export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 animate-pulse"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "var(--cg-border)" }} />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--cg-border)" }} />
                <div className="h-2 w-16 rounded" style={{ backgroundColor: "var(--cg-border)" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--cg-border)" }} />
              <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--cg-border)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
