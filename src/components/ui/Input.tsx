import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, icon, endIcon, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent z-10">
              {icon}
            </div>
          )}
          <input
          ref={ref}
          className={`
            flex w-full rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 text-sm transition-all duration-300
            file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-text-muted 
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent
            disabled:cursor-not-allowed disabled:opacity-50 hover:border-accent/30 shadow-sm
            ${icon ? 'pl-11' : ''}
            ${endIcon ? 'pr-11' : ''}
            ${error ? 'border-danger focus-visible:ring-danger/50 focus-visible:border-danger' : 'border-border'}
            ${className}
          `}
          {...props}
        />
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors z-10 flex items-center justify-center">
              {endIcon}
            </div>
          )}
        {error && (
          <span className="absolute -bottom-5 left-1 text-xs text-danger font-medium animate-fade-in">
            {error}
          </span>
        )}
        </div>
      </div>
    );
  }
);
Input.displayName = 'Input';
