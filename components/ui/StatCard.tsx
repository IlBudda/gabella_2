import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-3xl font-semibold text-text-primary tracking-tight">{value}</p>
        {(subtitle || trend) && (
          <div className="flex items-center mt-2 text-sm">
            {trend && (
              <span className={cn(
                "font-medium mr-2",
                trend.value > 0 ? "text-success" : trend.value < 0 ? "text-danger" : "text-text-secondary"
              )}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            )}
            <span className="text-text-secondary">{trend?.label || subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
