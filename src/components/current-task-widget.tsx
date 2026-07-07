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
  translations,
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

  const { currentTask, nextTask, timeRemaining, timeUntilNext, progress } = useMemo(() => {
    let current: Task | null = null;
    let next: Task | null = null;
    let remaining = 0;
    let untilNext = Infinity;
    let prog = 0;

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
        const duration = end - start;
        prog = duration > 0 ? Math.max(0, Math.min(100, ((duration - remaining) / duration) * 100)) : 0;
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
      timeUntilNext: untilNext,
      progress: prog,
    };
  }, [tasks, currentMinutes]);

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || '#888888';
  };

  const labelCls = 'font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground';

  if (!currentTask && !nextTask) {
    return (
      <div className="rounded-md border border-border bg-card p-4 flex items-center justify-center min-h-[120px]">
        <p className="text-sm text-muted-foreground text-center">
          {translations.noCurrentTask}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 flex flex-col gap-2.5 h-full">
      {/* Current Task */}
      {currentTask ? (
        <>
          <div className="flex items-center justify-between">
            <span className={labelCls}>{translations.currentTask}</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">{currentTask.status}</span>
          </div>
          <div className="font-semibold text-xl leading-tight">
            {currentTask.icon} {currentTask.name}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-[13px]">
              {currentTask.startTime} – {currentTask.endTime}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{ backgroundColor: getCategoryColor(currentTask.categoryName) }}
              />
              {currentTask.categoryName}
            </span>
          </div>
          <div className="h-[3px] rounded bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="font-mono text-[10.5px] text-muted-foreground">
            {translations.endsIn} {formatTimeRemaining(timeRemaining)}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <span className={labelCls}>{translations.currentTask}</span>
          <span className="font-mono text-[10.5px] text-muted-foreground">—</span>
        </div>
      )}

      {/* Next Task */}
      {nextTask && (
        <>
          <div className="mt-auto pt-1 h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className={labelCls}>{translations.nextTask}</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {formatTimeRemaining(timeUntilNext)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2.5">
            <span className="font-semibold text-sm flex items-center gap-2 min-w-0">
              <span
                className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(nextTask.categoryName) }}
              />
              <span className="truncate">{nextTask.icon} {nextTask.name}</span>
            </span>
            <span className="font-mono text-[11.5px] text-muted-foreground flex-shrink-0">
              {nextTask.startTime} – {nextTask.endTime}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
