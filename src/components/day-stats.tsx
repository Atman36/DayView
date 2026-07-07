'use client';

import type { FC } from 'react';
import { useMemo } from 'react';
import type { Task, Category } from '@/types';
import { detectOverlaps } from '@/utils/overlap-detection';

interface DayStatsProps {
  tasks: Task[];
  categories: Category[];
  translations: {
    dayFillness: string;
    conflicts: string;
    categoryBreakdown: string;
    hours: string;
    minutes: string;
  };
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const getTaskDuration = (task: Task): number => {
  const start = timeToMinutes(task.startTime);
  let end = timeToMinutes(task.endTime);
  if (end <= start) end += 1440; // overnight task
  return end - start;
};

export const DayStats: FC<DayStatsProps> = ({ tasks, categories, translations }) => {
  const stats = useMemo(() => {
    const totalMinutes = tasks.reduce((acc, task) => acc + getTaskDuration(task), 0);
    const fillPercentage = Math.round((totalMinutes / 1440) * 100);
    const overlappingIds = detectOverlaps(tasks);
    const conflictCount = overlappingIds.size > 0 ? Math.floor(overlappingIds.size / 2) : 0;

    const categoryStats: Record<string, number> = {};
    tasks.forEach(task => {
      const duration = getTaskDuration(task);
      categoryStats[task.categoryName] = (categoryStats[task.categoryName] || 0) + duration;
    });

    const rows = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);

    return { totalMinutes, fillPercentage, conflictCount, rows };
  }, [tasks]);

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || '#888888';
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}${translations.hours} ${mins}${translations.minutes}`;
    }
    if (hours > 0) return `${hours}${translations.hours}`;
    return `${mins}${translations.minutes}`;
  };

  const labelCls = 'font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground';

  return (
    <div className="rounded-md border border-border bg-card p-4 flex flex-col gap-2 h-full">
      <span className={labelCls}>{translations.dayFillness}</span>

      <div className="flex items-baseline gap-2.5">
        <span className={`font-semibold text-3xl leading-none ${stats.fillPercentage > 100 ? 'text-destructive' : ''}`}>
          {stats.fillPercentage}%
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {formatDuration(stats.totalMinutes)} / 24{translations.hours}
        </span>
      </div>

      {/* Stacked category bar (relative to 24h) */}
      <div className="flex h-2 rounded-sm overflow-hidden bg-muted my-1">
        {stats.rows.map(([category, minutes]) => (
          <div
            key={category}
            style={{
              width: `${Math.min(100, (minutes / 1440) * 100)}%`,
              backgroundColor: getCategoryColor(category),
            }}
          />
        ))}
      </div>

      {/* Category rows */}
      <div className="flex flex-col">
        {stats.rows.map(([category, minutes]) => (
          <div key={category} className="flex items-center gap-2 py-1">
            <span
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: getCategoryColor(category) }}
            />
            <span className="text-[12.5px] flex-1 truncate">{category}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{formatDuration(minutes)}</span>
            <span className="font-mono text-[11px] text-muted-foreground w-9 text-right">
              {Math.round((minutes / 1440) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {stats.conflictCount > 0 && (
        <div className="font-mono text-[10.5px] text-destructive mt-1">
          ⚠️ {translations.conflicts}: {stats.conflictCount}
        </div>
      )}
    </div>
  );
};
