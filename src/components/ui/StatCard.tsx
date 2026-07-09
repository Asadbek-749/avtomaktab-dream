import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './Card';
import { cn } from './Button';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, className }: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-text-primary">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {value}
              </motion.span>
            </h4>
            
            {trend && (
              <p className={cn("text-xs font-medium mt-2", trend.isPositive ? "text-success" : "text-danger")}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% o'tgan oydan
              </p>
            )}
          </div>
          
          <div className="w-12 h-12 rounded-full bg-accent-bg flex items-center justify-center text-accent">
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
