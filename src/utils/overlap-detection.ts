import type { Task } from '@/types';

/**
 * Converts time string (HH:MM) to minutes from midnight
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Checks if two time ranges overlap
 * Handles overnight tasks (e.g., 23:00 - 02:00)
 */
const timeRangesOverlap = (task1: Task, task2: Task): boolean => {
  const start1 = timeToMinutes(task1.startTime);
  const end1 = timeToMinutes(task1.endTime);
  const start2 = timeToMinutes(task2.startTime);
  const end2 = timeToMinutes(task2.endTime);

  // Handle overnight tasks
  const isOvernight1 = end1 <= start1;
  const isOvernight2 = end2 <= start2;

  // Normalize to handle overnight ranges
  const ranges1 = isOvernight1 
    ? [[start1, 1440], [0, end1]] 
    : [[start1, end1]];
  const ranges2 = isOvernight2 
    ? [[start2, 1440], [0, end2]] 
    : [[start2, end2]];

  // Check if any ranges overlap
  for (const [s1, e1] of ranges1) {
    for (const [s2, e2] of ranges2) {
      if (s1 < e2 && s2 < e1) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Detects all overlapping tasks and returns their IDs
 */
export const detectOverlaps = (tasks: Task[]): Set<string> => {
  const overlapping = new Set<string>();
  
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      if (timeRangesOverlap(tasks[i], tasks[j])) {
        overlapping.add(tasks[i].id);
        overlapping.add(tasks[j].id);
      }
    }
  }
  
  return overlapping;
};

/**
 * Returns overlap information for statistics
 */
export const getOverlapStats = (tasks: Task[]): { 
  overlappingIds: Set<string>; 
  conflictCount: number;
} => {
  const overlappingIds = detectOverlaps(tasks);
  return {
    overlappingIds,
    conflictCount: overlappingIds.size > 0 ? Math.floor(overlappingIds.size / 2) : 0
  };
};
