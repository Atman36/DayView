/**
 * Converts time string (HH:MM) to minutes from midnight.
 */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Converts minutes (possibly outside 0..1439) back to a "HH:MM" time of day.
 */
export const minutesToTime = (mins: number): string => {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

/**
 * Intersects a task's time range with a 12-hour dial window on the 24h circle.
 * windowStart is in minutes (360 = day dial 06:00-18:00, 1080 = night dial 18:00-06:00).
 * Returns 0..2 intervals in LINEAR minutes within [windowStart, windowStart+720];
 * interval bounds mod 1440 give real times of day. start===end is a 24h task (app convention).
 */
export const clipToWindow = (
  startTime: string,
  endTime: string,
  windowStart: number
): Array<{ start: number; end: number }> => {
  const s = timeToMinutes(startTime);
  let d = timeToMinutes(endTime) - s;
  if (d <= 0) d += 1440; // overnight wrap; start===end → full 24h (app convention)
  const w0 = windowStart;
  const w1 = windowStart + 720;
  const raw: Array<{ start: number; end: number }> = [];
  for (const k of [-1440, 0, 1440]) {
    const a = Math.max(s + k, w0);
    const b = Math.min(s + k + d, w1);
    if (b - a > 0) raw.push({ start: a, end: b });
  }
  raw.sort((x, y) => x.start - y.start);
  // merge touching/overlapping intervals (a 24h task can produce two abutting halves)
  const merged: Array<{ start: number; end: number }> = [];
  for (const iv of raw) {
    const last = merged[merged.length - 1];
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end);
    } else {
      merged.push({ ...iv });
    }
  }
  return merged;
};
