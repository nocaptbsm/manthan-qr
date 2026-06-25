import React, { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${glass ? 'glass-card' : 'card'} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-bold text-[var(--text-primary)] ${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    {children}
  </div>
);
