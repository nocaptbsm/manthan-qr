import React, { HTMLAttributes, ReactNode } from 'react';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard = ({ title, value, icon, trend, className = '', ...props }: StatCardProps) => {
  return (
    <div className={`stat-card ${className}`} {...props}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[var(--primary-50)] dark:bg-[var(--primary-900)] text-[var(--primary-600)] dark:text-[var(--primary-400)] flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-2 flex items-center text-xs font-medium">
          <span className={trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-[var(--text-muted)] ml-1.5">vs last month</span>
        </div>
      )}
    </div>
  );
};
