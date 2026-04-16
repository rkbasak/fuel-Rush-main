// Loading skeleton for the ration tracker page
export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-surface-elevated rounded w-40 animate-pulse" />
        <div className="h-4 bg-surface-elevated rounded w-64 mt-2 animate-pulse" />
      </div>

      {/* Main gauge skeleton */}
      <div className="flex justify-center py-6">
        <div className="w-48 h-48 bg-surface rounded-full animate-pulse flex items-center justify-center">
          <div className="w-36 h-36 bg-surface-elevated rounded-full animate-pulse" />
        </div>
      </div>

      {/* Vehicle selector skeleton */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-surface-elevated rounded w-24 animate-pulse" />
          <div className="h-8 w-16 bg-surface-elevated rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-elevated rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-elevated rounded w-1/2" />
                  <div className="h-3 bg-surface-elevated rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-card p-4 text-center animate-pulse">
            <div className="h-8 bg-surface-elevated rounded w-12 mx-auto mb-1" />
            <div className="h-3 bg-surface-elevated rounded w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* History skeleton */}
      <div>
        <div className="h-5 bg-surface-elevated rounded w-32 mb-3 animate-pulse" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-elevated rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-surface-elevated rounded w-3/4" />
                  <div className="h-3 bg-surface-elevated rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
