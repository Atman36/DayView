'use client';

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { Task, Category } from '@/types';
import { format } from 'date-fns-tz';

interface CurrentTaskWidgetProps {
  tasks: Task[];
  categories: Category[];
  timezone: string;
  translations: {
    currentTask: string;
    nextTask: string;
    noCurrentTask: string;
    endsIn: string;
    startsIn: string;
  };
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTimeRemaining = (minutes: number): string => {
  if (minutes < 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export const CurrentTaskWidget: FC<CurrentTaskWidgetProps> = ({ 
  tasks, 
  categories, 
  timezone,
  translations 
}) => {
  const [currentMinutes, setCurrentMinutes] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = format(now, 'HH:mm', { timeZone: timezone });
      setCurrentMinutes(timeToMinutes(timeString));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timezone]);

  const { currentTask, nextTask, timeRemaining, timeUntilNext } = useMemo(() => {
    let current: Task | null = null;
    let next: Task | null = null;
    let remaining = 0;
    let untilNext = Infinity;

    const sortedTasks = [...tasks].sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (const task of sortedTasks) {
      const start = timeToMinutes(task.startTime);
      let end = timeToMinutes(task.endTime);
      if (end <= start) end += 1440; // overnight

      const adjustedCurrent = currentMinutes < start && end > 1440 
        ? currentMinutes + 1440 
        : currentMinutes;

      if (adjustedCurrent >= start && adjustedCurrent < end) {
        current = task;
        remaining = end - adjustedCurrent;
      } else if (start > currentMinutes && !next) {
        next = task;
        untilNext = start - currentMinutes;
      }
    }

    // If no next task found, check for tasks that start after midnight
    if (!next && sortedTasks.length > 0) {
      const firstTask = sortedTasks[0];
      const firstStart = timeToMinutes(firstTask.startTime);
      if (firstStart < currentMinutes) {
        next = firstTask;
        untilNext = (1440 - currentMinutes) + firstStart;
      }
    }

    return { 
      currentTask: current, 
      nextTask: next, 
      timeRemaining: remaining,
      timeUntilNext: untilNext
    };
  }, [tasks, currentMinutes]);

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || '#888888';
  };

  if (!currentTask && !nextTask) {
    return (
      <div className="p-4 rounded-lg bg-card border border-border">
        <p className="text-sm text-muted-foreground text-center">
          {translations.noCurrentTask}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Current Task */}
      {currentTask && (
        <div 
          className="p-4 rounded-lg border-2 transition-all"
          style={{ 
            borderColor: getCategoryColor(currentTask.categoryName),
            boxShadow: `0 0 12px ${getCategoryColor(currentTask.categoryName)}40`
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: getCategoryColor(currentTask.categoryName) }}
            />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {translations.currentTask}
            </span>
          </div>
          <h3 className="font-semibold text-lg">{currentTask.icon} {currentTask.name}</h3>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">
              {currentTask.startTime} – {currentTask.endTime}
            </span>
            <span className="text-sm font-medium">
              {translations.endsIn} {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Next Task */}
      {nextTask && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {translations.nextTask}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getCategoryColor(nextTask.categoryName) }}
            />
            <span className="font-medium">{nextTask.icon} {nextTask.name}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              {nextTask.startTime} – {nextTask.endTime}
            </span>
            <span className="text-xs text-muted-foreground">
              {translations.startsIn} {formatTimeRemaining(timeUntilNext)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
