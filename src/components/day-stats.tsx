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

    // Category breakdown
    const categoryStats: Record<string, number> = {};
    tasks.forEach(task => {
      const duration = getTaskDuration(task);
      categoryStats[task.categoryName] = (categoryStats[task.categoryName] || 0) + duration;
    });

    return {
      totalMinutes,
      fillPercentage,
      conflictCount,
      categoryStats,
      overlappingIds
    };
  }, [tasks]);

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

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

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-4">
      {/* Day Fillness */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{translations.dayFillness}</span>
          <span className={`text-sm font-bold ${stats.fillPercentage > 100 ? 'text-red-500' : ''}`}>
            {stats.fillPercentage}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getProgressColor(stats.fillPercentage)}`}
            style={{ width: `${Math.min(stats.fillPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Conflicts */}
      {stats.conflictCount > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/30">
          <span className="text-red-500">⚠️</span>
          <span className="text-sm text-red-500 font-medium">
            {translations.conflicts}: {stats.conflictCount}
          </span>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(stats.categoryStats).length > 0 && (
        <div>
          <span className="text-sm font-medium mb-2 block">{translations.categoryBreakdown}</span>
          <div className="space-y-2">
            {Object.entries(stats.categoryStats)
              .sort((a, b) => b[1] - a[1])
              .map(([category, minutes]) => (
                <div key={category} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(category) }}
                  />
                  <span className="text-sm flex-1 truncate">{category}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(minutes)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
