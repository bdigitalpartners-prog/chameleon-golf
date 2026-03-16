export default function OnboardingLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-pulse">
          <div className="h-7 w-64 rounded mx-auto mb-2" style={{ backgroundColor: "var(--cg-border)" }} />
          <div className="h-4 w-48 rounded mx-auto" style={{ backgroundColor: "var(--cg-border)" }} />
        </div>
        <div className="flex items-center justify-center gap-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: "var(--cg-border)" }} />
          ))}
        </div>
        <div
          className="rounded-xl p-6 animate-pulse"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <div className="h-6 w-48 rounded mb-4" style={{ backgroundColor: "var(--cg-border)" }} />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg" style={{ backgroundColor: "var(--cg-border)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
