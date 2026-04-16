// Loading skeleton for the map page
export default function Loading() {
  return (
    <div className="relative h-[calc(100vh-7rem)]">
      {/* Map skeleton */}
      <div className="w-full h-full bg-surface animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading map...</p>
        </div>
      </div>

      {/* Filter chips skeleton */}
      <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="shrink-0 w-20 h-8 bg-surface-elevated rounded-full animate-pulse" />
          ))}
        </div>
      </div>

      {/* Bottom sheet skeleton */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-card p-4">
        <div className="w-12 h-1 bg-surface-elevated rounded-full mx-auto mb-4" />
        <div className="space-y-3">
          <div className="h-6 bg-surface-elevated rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-surface-elevated rounded w-1/2 animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 bg-surface-elevated rounded flex-1 animate-pulse" />
            <div className="h-10 bg-surface-elevated rounded flex-1 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
