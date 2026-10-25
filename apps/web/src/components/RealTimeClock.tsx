'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RealTimeClockProps {
  className?: string;
  showDate?: boolean;
  showPSTLabel?: boolean;
  variant?: 'default' | 'banner' | 'compact';
}

export const RealTimeClock: React.FC<RealTimeClockProps> = ({
  className,
  showDate = true,
  showPSTLabel = true,
  variant = 'default',
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted || !currentTime) {
    return (
      <div
        data-testid="realtime-clock-skeleton"
        className={cn(
          'inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-100/70 text-slate-400 border border-slate-200/50 animate-pulse',
          className
        )}
      >
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="tabular-nums">--:--:-- --</span>
      </div>
    );
  }

  // Format date and time according to Philippine Standard Time (PST / UTC+8)
  const formattedDate = currentTime.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  if (variant === 'banner') {
    return (
      <div
        aria-label="Philippine Standard Time"
        data-testid="realtime-clock"
        className={cn(
          'inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl text-xs font-mono backdrop-blur-sm transition-all',
          className
        )}
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Clock className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
        <span className="tabular-nums font-semibold tracking-tight">
          {showDate && <span>{formattedDate} &bull; </span>}
          <span>{formattedTime}</span>
        </span>
        {showPSTLabel && (
          <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded border border-white/20">
            PST
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      aria-label="Philippine Standard Time"
      data-testid="realtime-clock"
      className={cn(
        'inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-700 bg-white/80 border border-slate-200/80 shadow-neu-xs transition-all',
        className
      )}
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
      </span>
      <Clock className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
      <span className="tabular-nums font-semibold text-slate-800">
        {showDate && <span className="hidden sm:inline">{formattedDate} &bull; </span>}
        <span>{formattedTime}</span>
      </span>
      {showPSTLabel && (
        <span className="hidden md:inline text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
          PST
        </span>
      )}
    </div>
  );
};
