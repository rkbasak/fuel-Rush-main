import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', hoverable = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface border border-border',
      elevated: 'bg-surface-elevated shadow-lg',
      outlined: 'bg-transparent border border-border',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={`
          rounded-card transition-all duration-200
          ${variants[variant]} ${paddings[padding]}
          ${hoverable ? 'card-hover cursor-pointer hover:bg-surface-elevated' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
