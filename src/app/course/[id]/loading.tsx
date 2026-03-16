export default function CourseDetailLoading() {
  return (
    <div style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* Hero skeleton */}
      <div className="relative overflow-hidden">
        <div
          className="aspect-[21/9] max-h-[480px] w-full animate-pulse"
          style={{ backgroundColor: "var(--cg-border)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 md:px-6 md:pb-6">
          <div className="mx-auto max-w-7xl space-y-3">
            <div
              className="h-10 w-72 rounded animate-pulse"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            />
            <div
              className="h-4 w-48 rounded animate-pulse"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            />
            <div className="flex gap-4">
              <div
                className="h-4 w-32 rounded animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              />
              <div
                className="h-4 w-20 rounded animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              />
              <div
                className="h-4 w-24 rounded animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div
        className="sticky top-0 z-30"
        style={{
          backgroundColor: "var(--cg-bg-primary)",
          borderBottom: "1px solid var(--cg-border)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 py-3">
            {["w-20", "w-24", "w-28", "w-20"].map((w, i) => (
              <div
                key={i}
                className={`h-5 ${w} rounded animate-pulse`}
                style={{ backgroundColor: "var(--cg-border)" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About card */}
            <div
              className="rounded-xl p-6 animate-pulse"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div
                className="h-6 w-48 rounded mb-4"
                style={{ backgroundColor: "var(--cg-border)" }}
              />
              <div className="space-y-2">
                <div
                  className="h-3 w-full rounded"
                  style={{ backgroundColor: "var(--cg-border)" }}
                />
                <div
                  className="h-3 w-full rounded"
                  style={{ backgroundColor: "var(--cg-border)" }}
                />
                <div
                  className="h-3 w-3/4 rounded"
                  style={{ backgroundColor: "var(--cg-border)" }}
                />
              </div>
            </div>

            {/* Course info card */}
            <div
              className="rounded-xl p-6 animate-pulse"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div
                className="h-6 w-40 rounded mb-4"
                style={{ backgroundColor: "var(--cg-border)" }}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div
                      className="h-3 w-16 rounded"
                      style={{ backgroundColor: "var(--cg-border)" }}
                    />
                    <div
                      className="h-4 w-24 rounded"
                      style={{ backgroundColor: "var(--cg-border)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Rankings card */}
            <div
              className="rounded-xl p-6 animate-pulse"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div
                className="h-6 w-32 rounded mb-4"
                style={{ backgroundColor: "var(--cg-border)" }}
              />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg"
                    style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score card */}
            <div
              className="rounded-xl p-6 animate-pulse"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div
                className="h-6 w-28 rounded mb-4"
                style={{ backgroundColor: "var(--cg-border)" }}
              />
              <div
                className="h-20 w-20 rounded-full mx-auto mb-4"
                style={{ backgroundColor: "var(--cg-border)" }}
              />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="h-3 w-20 rounded"
                      style={{ backgroundColor: "var(--cg-border)" }}
                    />
                    <div
                      className="h-1.5 flex-1 rounded-full"
                      style={{ backgroundColor: "var(--cg-border)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick info card */}
            <div
              className="rounded-xl p-6 animate-pulse"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div
                className="h-5 w-24 rounded mb-3"
                style={{ backgroundColor: "var(--cg-border)" }}
              />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-full rounded"
                    style={{ backgroundColor: "var(--cg-border)" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
