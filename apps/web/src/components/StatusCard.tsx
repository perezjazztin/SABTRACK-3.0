import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusCardProps {
  title: string;
  status: 'online' | 'offline' | 'degraded' | 'neutral';
  value: string;
  subtext?: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  value,
  subtext,
  icon: Icon,
  action,
}) => {
  const statusStyles = {
    online: {
      border: 'border-emerald-200/80',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotBg: 'bg-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
    degraded: {
      border: 'border-amber-200/80',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      dotBg: 'bg-amber-500',
      iconBg: 'bg-amber-50 text-amber-700',
    },
    offline: {
      border: 'border-rose-200/80',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      dotBg: 'bg-rose-500',
      iconBg: 'bg-rose-50 text-rose-700',
    },
    neutral: {
      border: 'border-slate-200/80',
      badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
      dotBg: 'bg-slate-400',
      iconBg: 'bg-slate-50 text-slate-600',
    },
  }[status];

  return (
    <div
      className={cn(
        'neu-card rounded-2xl border bg-white p-5 sm:p-6 shadow-neu-sm hover:shadow-neu-raised transition-all duration-200',
        statusStyles.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn('p-2.5 rounded-xl shadow-neu-xs', statusStyles.iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {title}
            </h4>
            <div className="text-lg font-black text-slate-900 mt-0.5 flex items-center space-x-2">
              <span>{value}</span>
            </div>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-neu-xs',
            statusStyles.badgeBg
          )}
        >
          <span
            className={cn('w-1.5 h-1.5 rounded-full mr-1.5', statusStyles.dotBg)}
          />
          {status.toUpperCase()}
        </span>
      </div>

      {subtext && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 font-medium">
          {subtext}
        </p>
      )}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};
