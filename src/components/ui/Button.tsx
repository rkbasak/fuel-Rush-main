'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed btn-press';
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-light active:bg-primary-dark shadow-sm hover:shadow-glow-orange',
      secondary: 'bg-surface-elevated text-text-primary border border-border hover:bg-surface hover:border-primary/50 active:scale-[0.98]',
      danger: 'bg-danger text-white hover:bg-danger/90 active:scale-[0.98] shadow-sm hover:shadow-glow-red',
      ghost: 'bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-btn min-h-[36px]',
      md: 'text-sm px-4 py-2.5 rounded-btn min-h-[44px]',
      lg: 'text-base px-6 py-3 rounded-btn min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
