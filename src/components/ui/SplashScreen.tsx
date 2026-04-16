'use client';

import { Fuel } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  minDuration?: number;
  onComplete?: () => void;
}

export function SplashScreen({ minDuration = 2000, onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start entrance animation
    const entranceTimer = setTimeout(() => {
      setIsAnimating(true);
    }, 100);

    // Hide splash after minimum duration
    const hideTimer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 300);
    }, minDuration);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(hideTimer);
    };
  }, [minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-9999 bg-background 
        flex flex-col items-center justify-center
        transition-opacity duration-300
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Logo animation container */}
      <div className={`
        relative mb-8 transition-transform duration-700
        ${isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
      `}>
        {/* Glowing ring */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-ring" />
        
        {/* Logo circle */}
        <div className="relative w-28 h-28 bg-linear-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-glow-orange animate-fuel-drop">
          <Fuel className="w-14 h-14 text-white" />
        </div>

        {/* Floating particles */}
        <div className="absolute -top-4 -left-4 w-3 h-3 bg-primary rounded-full animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute -top-2 -right-6 w-2 h-2 bg-accent rounded-full animate-float" style={{ animationDelay: '0.3s' }} />
        <div className="absolute -bottom-4 -left-8 w-2 h-2 bg-success rounded-full animate-float" style={{ animationDelay: '0.6s' }} />
        <div className="absolute -bottom-2 -right-4 w-3 h-3 bg-warning rounded-full animate-float" style={{ animationDelay: '0.9s' }} />
      </div>

      {/* App name */}
      <div className={`
        text-center transition-all duration-500 delay-300
        ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}>
        <h1 className="text-4xl font-display font-extrabold text-text-primary mb-2 tracking-tight">
          Fuel Rush
        </h1>
        <p className="text-text-muted text-sm mb-6">
          Bangladesh&apos;s Fuel Intelligence Platform
        </p>
        
        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 bg-primary rounded-full animate-typing-dot" />
          <div className="w-2 h-2 bg-primary rounded-full animate-typing-dot" />
          <div className="w-2 h-2 bg-primary rounded-full animate-typing-dot" />
        </div>
      </div>

      {/* Tagline */}
      <div className={`
        absolute bottom-16 text-center transition-all duration-500 delay-500
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `}>
        <p className="text-text-muted text-xs">
          Never wait in line for fuel again
        </p>
      </div>
    </div>
  );
}
