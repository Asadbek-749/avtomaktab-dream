import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:opacity-90 text-[#090909] shadow-lg shadow-[var(--accent)]/30 hover:shadow-[var(--accent)]/50 border border-[var(--accent)]/20',
    secondary: 'bg-bg-hover text-text-primary hover:bg-border border border-transparent shadow-sm',
    danger: 'bg-gradient-to-r from-danger to-red-400 hover:to-red-300 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50',
    outline: 'border-2 border-border bg-transparent text-text-primary hover:border-accent hover:text-accent hover:bg-accent/5',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm sm:text-base',
    lg: 'px-6 py-3 text-base sm:text-lg'
  };

  return (
    <motion.button
      ref={ref}
      disabled={disabled || isLoading}
      whileTap={{ scale: 0.95 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children as React.ReactNode}
    </motion.button>
  );
});

Button.displayName = 'Button';
