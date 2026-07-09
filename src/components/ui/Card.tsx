import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from './Button';

export const Card = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(({ className = '', ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn("glass-card rounded-2xl", className)}
      {...props}
    />
  );
});
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(({ className = '', ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 border-b border-border/50", className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, HTMLMotionProps<"h3">>(({ className = '', ...props }, ref) => (
  <motion.h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-xl text-text-primary", className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(({ className = '', ...props }, ref) => (
  <motion.div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = 'CardContent';
