'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
        <p className="text-text-muted mb-6">
          {error.message || 'An unexpected error occurred in this section.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary-light transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
