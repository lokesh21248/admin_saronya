import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

export function MetricCard({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon,
  accentColor = 'text-[#0B3473]',
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className={cn('p-2.5 rounded-lg bg-slate-100/80', accentColor)}>
            {icon}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {change && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded',
                isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              )}
            >
              {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {change}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

