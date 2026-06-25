import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`input ${error ? 'input-error' : ''} ${icon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-[var(--error)] mt-1 animate-slide-up">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
