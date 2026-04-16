import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="text-center max-w-md relative z-10">
        {/* Animated fuel pump */}
        <div className="relative mb-8">
          <div className="text-8xl mb-4 animate-float">⛽</div>
          <div className="absolute -top-2 -right-2 text-4xl animate-bounce">💨</div>
        </div>
        
        {/* Error code */}
        <div className="mb-4">
          <span className="text-8xl font-display font-extrabold text-primary/20">404</span>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-display font-bold text-text-primary mb-3">
          Out of Fuel!
        </h1>
        
        {/* Description */}
        <p className="text-text-muted mb-8 leading-relaxed">
          The page you&apos;re looking for has run out of fuel 
          or doesn&apos;t exist. Let&apos;s get you back on the road.
        </p>
        
        {/* Action button */}
        <Link
          href="/main/map"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary-light transition-all duration-200 shadow-glow-orange hover:scale-105"
        >
          <span className="text-xl">⛽</span>
          <span>Back to Fuel Rush</span>
        </Link>
        
        {/* Quick links */}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-text-muted">
          <Link href="/main/stations" className="hover:text-primary transition-colors">
            Stations
          </Link>
          <span>·</span>
          <Link href="/main/ration" className="hover:text-primary transition-colors">
            Ration Tracker
          </Link>
          <span>·</span>
          <Link href="/main/route" className="hover:text-primary transition-colors">
            Route Planner
          </Link>
        </div>
      </div>
    </div>
  );
}
