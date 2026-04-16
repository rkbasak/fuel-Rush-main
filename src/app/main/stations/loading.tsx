// Loading skeleton for the stations page
export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Search bar skeleton */}
      <div className="relative">
        <div className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-card animate-pulse" />
      </div>

      {/* Filter chips skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="shrink-0 w-16 h-8 bg-surface rounded-full animate-pulse" />
        ))}
      </div>

      {/* Station count skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-surface-elevated rounded w-32 animate-pulse" />
      </div>

      {/* Station list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-card p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-surface-elevated rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-surface-elevated rounded w-3/4" />
                <div className="h-3 bg-surface-elevated rounded w-1/2" />
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 bg-surface-elevated rounded-full" />
                  <div className="h-4 w-16 bg-surface-elevated rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
