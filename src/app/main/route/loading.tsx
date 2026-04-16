// Loading skeleton for the route planner page
export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-surface-elevated rounded w-40 animate-pulse" />
        <div className="h-4 bg-surface-elevated rounded w-56 mt-2 animate-pulse" />
      </div>

      {/* Summary card skeleton */}
      <div className="bg-surface border border-border rounded-card p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-surface-elevated rounded" />
            <div className="space-y-1">
              <div className="h-4 bg-surface-elevated rounded w-24" />
              <div className="h-3 bg-surface-elevated rounded w-36" />
            </div>
          </div>
          <div className="h-5 w-20 bg-surface-elevated rounded-full" />
        </div>
      </div>

      {/* Optimizer card skeleton */}
      <div className="bg-surface border border-border rounded-card p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-surface-elevated rounded" />
          <div className="h-5 bg-surface-elevated rounded w-36" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-surface-elevated rounded w-full" />
          <div className="h-3 bg-surface-elevated rounded w-5/6" />
          <div className="h-3 bg-surface-elevated rounded w-4/6" />
        </div>
        <div className="flex items-start gap-2 p-3 bg-surface-elevated rounded-card mb-4">
          <div className="w-4 h-4 bg-border rounded shrink-0 mt-0.5" />
          <div className="h-3 bg-border rounded w-full" />
        </div>
        <div className="h-10 bg-surface-elevated rounded animate-pulse" />
      </div>

      {/* Empty state / route skeleton */}
      <div className="text-center py-12 animate-pulse">
        <div className="text-5xl mb-4">🗺️</div>
        <div className="h-6 bg-surface-elevated rounded w-40 mx-auto mb-2" />
        <div className="h-4 bg-surface-elevated rounded w-64 mx-auto" />
      </div>
    </div>
  );
}
