'use client';
import type { FC } from 'react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { Task, Category } from '@/types';
import { timeToAngle, getSegmentPath, isDarkColor, timeToAngle12 } from '@/utils/color';
import { clipToWindow } from '@/utils/time-window';
import { TaskDialog } from './task-dialog';
import { format } from 'date-fns-tz';
import { detectOverlaps } from '@/utils/overlap-detection';

// Time constants
const MINUTES_PER_DAY = 1440;
const MINUTES_PER_12_HOURS = 720;
const DEFAULT_TASK_DURATION_MINUTES = 120; // 2 hours
const CURRENT_TIME_UPDATE_INTERVAL_MS = 300000; // 5 minutes

// Nocturne dial geometry (viewBox 360 x 370, center at 180,180)
const CENTER = 180;
const FACE_R = 170;   // dial face + backdrop for the dotted ring
const DOT_R = 163;    // dotted minute ring radius
const NUM_R = 145;    // hour numbers (mono), sit inside the dot ring
const SEG_R = 132;    // task segment outer radius (inside the numbers)
const HAND_LEN = 120; // current-time hand length
const TAIL_LEN = 26;  // amber counterweight length

// Dotted ring dash geometry: round-capped 0.1 dashes render as dots.
const DOT_CIRC = 2 * Math.PI * DOT_R;
const MINOR_DASH = `0.1 ${(DOT_CIRC / 60 - 0.1).toFixed(3)}`; // 60 minute dots
const MAJOR_DASH = `0.1 ${(DOT_CIRC / 12 - 0.1).toFixed(3)}`; // 12 hour dots

interface ClockDiagramProps {
  startTime: string;
  endTime: string;
  tasks: Task[];
  categories: Category[];
  isDayClock?: boolean;
  timezone: string;
  onAddTask: (task: Omit<Task, "id">) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const ClockDiagram: FC<ClockDiagramProps> = ({
  startTime,
  endTime,
  tasks,
  categories,
  isDayClock = false,
  timezone,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const center = CENTER;
  const radius = SEG_R;
  const [isClient, setIsClient] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ taskId: string; edge: "start" | "end" } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addInitialValues, setAddInitialValues] = useState<Partial<Task> | null>(null);
  const [currentTimeAngle, setCurrentTimeAngle] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);

    const updateCurrentTime = () => {
      const now = new Date();
      const timeString = format(now, 'HH:mm', { timeZone: timezone });
      const currentHour = parseInt(timeString.split(':')[0]);

      let isOnThisClock = false;
      const startHour24 = parseInt(startTime.split(':')[0]);
      const endHour24 = parseInt(endTime.split(':')[0]);

      if (startHour24 < endHour24) {
          isOnThisClock = currentHour >= startHour24 && currentHour < endHour24;
      } else {
          isOnThisClock = currentHour >= startHour24 || currentHour < endHour24;
      }

      if (isOnThisClock) {
        setCurrentTimeAngle(timeToAngle12(timeString));
      } else {
        setCurrentTimeAngle(null);
      }
    };

    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, CURRENT_TIME_UPDATE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [timezone, startTime, endTime, isClient]);

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.name] = category.color;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  // Detect overlapping tasks
  const overlappingTaskIds = useMemo(() => detectOverlaps(tasks), [tasks]);

  const getTaskColor = (categoryName: string): string => {
    return categoryMap[categoryName] || '#cccccc';
  };

  const isTimeVisible = useCallback(
    (time: string, start: string, end: string): boolean => {
      const timeMinutes = convertTimeToMinutes(time);
      const startMinutes = convertTimeToMinutes(start);
      const endMinutes = convertTimeToMinutes(end);

      if (startMinutes <= endMinutes) {
        return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
      } else {
        return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
      }
    },
    []
  );

  const convertTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (m: number): string => {
    const mm = ((m % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const h = Math.floor(mm / 60);
    const min = mm % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(min)}`;
  };

  const startMinuteAbs = useMemo(() => convertTimeToMinutes(startTime), [startTime]);

  const calculateAngle = useCallback((time: string): number => {
    return timeToAngle12(time);
  }, []);

  const segments = useMemo(() => {
    if (!isClient) return [];

    const windowStart = convertTimeToMinutes(startTime); // component's own window prop

    return tasks.flatMap((task) => {
      const color = getTaskColor(task.categoryName);

      return clipToWindow(task.startTime, task.endTime, windowStart).map((iv, i) => {
        const startAngle = calculateAngle(minutesToTime(iv.start));
        const endAngle = calculateAngle(minutesToTime(iv.end));

        let deltaAngle = endAngle - startAngle;
        if (deltaAngle <= 0) {
            deltaAngle += 360;
        }

        const innerRadius = radius * 0.01; // Небольшой внутренний радиус
        const path = getSegmentPath(center, center, innerRadius, radius, startAngle, endAngle);

        const textAngle = (startAngle + deltaAngle / 2) % 360;

        return {
          ...task,
          path,
          color,
          textAngle,
          textColor: isDarkColor(color) ? '#FFFFFF' : '#000000',
          originalTask: task,
          deltaAngle: deltaAngle,
          startAngle: startAngle,
          endAngle: endAngle,
          innerRadius: innerRadius,
          isHovered: false, // Add hover state
          icon: task.icon, // Pass icon through
          segmentKey: `${task.id}:${i}`,
        };
      });
    });
  }, [tasks, categories, categoryMap, center, radius, isClient, startTime]);

  // Hour numbers (mono) placed INSIDE the dotted ring — the Nocturne signature.
  const hourNumbers = useMemo(() => {
    if (!isClient) return [];
    const hours = isDayClock
      ? [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
      : [19, 20, 21, 22, 23, 24, 1, 2, 3, 4, 5, 6];

    return hours.map((hour24) => {
      const time = `${(hour24 % 24).toString().padStart(2, '0')}:00`;
      const angle = calculateAngle(time);
      const x = center + NUM_R * Math.cos(((angle - 90) * Math.PI) / 180);
      const y = center + NUM_R * Math.sin(((angle - 90) * Math.PI) / 180);
      const isCardinal = hour24 === 12 || hour24 === 24 || hour24 === 6 || hour24 === 18;
      return (
        <text
          key={`hour-${hour24}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={isCardinal ? 15 : 13}
          fontWeight={isCardinal ? 600 : 500}
          fill="var(--dial-ink)"
          opacity={isCardinal ? 1 : 0.82}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {hour24.toString()}
        </text>
      );
    });
  }, [isDayClock, center, isClient, calculateAngle]);

  const handleSegmentClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleDialogSave = (updatedTask: Task | Omit<Task, "id">) => {
    if ((updatedTask as Task).id) {
      onEditTask(updatedTask as Task);
    } else {
      onAddTask(updatedTask as Omit<Task, 'id'>);
    }
    handleDialogClose();
    setIsAddDialogOpen(false);
    setAddInitialValues(null);
  };

  const renderSegmentText = useCallback((segment: Task & {
    path: string;
    color: string;
    textAngle: number;
    textColor: string;
    originalTask: Task;
    deltaAngle: number;
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    isHovered: boolean;
  }) => {
    const textRadius = segment.innerRadius + (radius - segment.innerRadius) * 0.66;
    const approximateArcLength = segment.deltaAngle * (Math.PI / 180) * textRadius;
    const nameFont = 9.5;
    const timeFont = 7.5;
    const averageCharWidth = 5.6;
    const maxTextWidth = approximateArcLength * 0.92;
    const charactersPerLine = Math.max(1, Math.floor(maxTextWidth / averageCharWidth));

    if (segment.deltaAngle < 9 || maxTextWidth < nameFont * 2) return null;

    // Proper-case task name (with icon), wrapped to at most 2 lines — Nocturne style.
    const name = segment.icon ? `${segment.icon} ${segment.name}` : segment.name;
    const words = name.split(' ');
    const MAX_LINES = 2;

    const nameLines: string[] = [];
    let currentLine = '';
    let truncated = false;

    for (const word of words) {
      if (nameLines.length >= MAX_LINES) { truncated = true; break; }
      if ((currentLine ? currentLine.length + 1 : 0) + word.length <= charactersPerLine) {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      } else if (currentLine) {
        nameLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = word.substring(0, Math.max(1, charactersPerLine - 1));
        truncated = true;
      }
    }
    if (currentLine && nameLines.length < MAX_LINES) nameLines.push(currentLine);
    if ((truncated || (currentLine && nameLines.length >= MAX_LINES)) && nameLines.length) {
      let last = nameLines[nameLines.length - 1];
      if (last.length > charactersPerLine) last = last.substring(0, Math.max(1, charactersPerLine - 1));
      nameLines[nameLines.length - 1] = `${last}…`;
    }

    // Show the time range only when the segment is roomy enough for it.
    const showTime = maxTextWidth >= 52 && segment.deltaAngle >= 15;
    const items: { text: string; kind: 'name' | 'time' }[] = [
      ...nameLines.map((l) => ({ text: l, kind: 'name' as const })),
      ...(showTime ? [{ text: `${segment.startTime}–${segment.endTime}`, kind: 'time' as const }] : []),
    ];

    const lineHeight = 10.5;
    const midpointAngle = segment.startAngle + segment.deltaAngle / 2;
    const cx = center + textRadius * Math.cos((midpointAngle - 90) * (Math.PI / 180));
    const cy = center + textRadius * Math.sin((midpointAngle - 90) * (Math.PI / 180));
    const fill = isDarkColor(segment.color) ? '#FFFFFF' : '#1A1A18';

    return items.map((item, index) => {
      const offset = (index - (items.length - 1) / 2) * lineHeight;
      const isTime = item.kind === 'time';
      return (
        <text
          key={`segment-text-${segment.id}-${index}`}
          x={cx}
          y={cy + offset}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={fill}
          fontSize={isTime ? timeFont : nameFont}
          fontWeight={isTime ? 500 : 600}
          opacity={isTime ? 0.72 : segment.id === hoveredSegment ? 1 : 0.95}
          style={{ fontFamily: isTime ? 'var(--font-mono)' : 'var(--font-sans)' }}
        >
          {item.text}
        </text>
      );
    });
  }, [center, radius, hoveredSegment]);

  if (!isClient) {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground">Загрузка часов...</div>;
  }

  // Конвертация угла клика в абсолютные минуты (от полуокна startTime)
  const angleToAbsMinutes = (angle: number) => {
    // Минуты в пределах 12-часового круга, где 0° = 12:00
    const minutesIn12 = Math.round((angle / 360) * MINUTES_PER_12_HOURS) % MINUTES_PER_12_HOURS;
    const startAbs = startMinuteAbs;
    // База для ближайшего 12-часового цикла относительно начала окна
    const base = Math.floor(startAbs / MINUTES_PER_12_HOURS) * MINUTES_PER_12_HOURS;
    const cand1 = (base + minutesIn12) % MINUTES_PER_DAY;
    const cand2 = (base + MINUTES_PER_12_HOURS + minutesIn12) % MINUTES_PER_DAY;
    const off1 = (cand1 - startAbs + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const off2 = (cand2 - startAbs + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    // Выбираем кандидат, попадающий в текущее 12-часовое окно
    return off1 < MINUTES_PER_12_HOURS ? cand1 : cand2;
  };

  const handleBackgroundClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Координаты клика в системе viewBox
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 360;
    const y = ((e.clientY - rect.top) / rect.height) * 370;
    const dx = x - center;
    const dy = y - center;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    const clickedAbsMinutes = angleToAbsMinutes(angle);
    const clickedOffset = (clickedAbsMinutes - startMinuteAbs + MINUTES_PER_DAY) % MINUTES_PER_DAY; // 0..1439
    // Найти конец предыдущей задачи внутри 12-часового окна
    const endOffsets = tasks.map(t => {
      const endM = convertTimeToMinutes(t.endTime);
      const off = (endM - startMinuteAbs + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      return { endAbs: endM, endOffset: off };
    });
    const within = endOffsets.filter(o => o.endOffset < MINUTES_PER_12_HOURS);
    let prev = within
      .filter(o => o.endOffset <= clickedOffset)
      .sort((a, b) => b.endOffset - a.endOffset)[0];
    if (!prev) {
      prev = within.sort((a, b) => b.endOffset - a.endOffset)[0];
    }
    const startAbs = prev ? prev.endAbs : startMinuteAbs;
    const endAbs = (startAbs + DEFAULT_TASK_DURATION_MINUTES) % MINUTES_PER_DAY;

    setAddInitialValues({ startTime: minutesToTime(startAbs), endTime: minutesToTime(endAbs) });
    setIsAddDialogOpen(true);
  };

  // Current-time hand endpoints (Nocturne: ink hand + amber counterweight tail).
  let handGeom: { hx: number; hy: number; tx: number; ty: number } | null = null;
  if (currentTimeAngle !== null) {
    const rad = ((currentTimeAngle - 90) * Math.PI) / 180;
    handGeom = {
      hx: center + HAND_LEN * Math.cos(rad),
      hy: center + HAND_LEN * Math.sin(rad),
      tx: center - TAIL_LEN * Math.cos(rad),
      ty: center - TAIL_LEN * Math.sin(rad),
    };
  }

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 360 370" className="w-full h-full" style={{ padding: '6px' }} onClick={handleBackgroundClick}>
        {/* Dial face */}
        <circle cx={center} cy={center} r={FACE_R} fill="var(--dial-face)" stroke="var(--dial-hair)" strokeWidth="1" />

        {/* Dotted minute ring — 60 minute dots + 12 hour dots (signature) */}
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={DOT_R}
            fill="none"
            stroke="var(--dial-ink2)"
            strokeWidth="2.2"
            strokeDasharray={MINOR_DASH}
            strokeLinecap="round"
          />
          <circle
            cx={center}
            cy={center}
            r={DOT_R}
            fill="none"
            stroke="var(--dial-ink)"
            strokeWidth="4.2"
            strokeDasharray={MAJOR_DASH}
            strokeLinecap="round"
          />
        </g>

        {/* Task segments */}
        {segments.map((segment) => {
          const isOverlapping = overlappingTaskIds.has(segment.id);
          const isHovered = hoveredSegment === segment.id;
          return (
            <g
              key={segment.segmentKey}
              data-segment-id={segment.id}
              onClick={(e) => segment.originalTask && handleSegmentClick(e, segment.originalTask)}
              onMouseEnter={() => setHoveredSegment(segment.id)}
              onMouseLeave={() => setHoveredSegment(null)}
              className="cursor-pointer group"
            >
              <path
                d={segment.path}
                fill={segment.color}
                stroke={isOverlapping ? 'var(--dial-warn)' : 'var(--dial-face)'}
                strokeWidth={isOverlapping ? 2 : 1.1}
                strokeLinejoin="round"
                className={`transition-all duration-150 ${isOverlapping ? 'animate-pulse' : ''}`}
                style={{
                  filter: isHovered ? 'brightness(1.08)' : 'none',
                  opacity: isOverlapping ? 1 : isHovered ? 1 : 0.94,
                }}
              >
                <title>{segment.name} — {segment.startTime}–{segment.endTime}{isOverlapping ? ' ⚠️ Конфликт!' : ''}</title>
              </path>
            </g>
          );
        })}

        {/* Hour numbers */}
        {hourNumbers}

        {/* Subtle 1b dial signature from the Nocturne reference. */}
        <text
          x={center}
          y={center + 30}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--dial-ink2)"
          fontSize="7.5"
          fontWeight="600"
          letterSpacing="0.32em"
          opacity="0.36"
          pointerEvents="none"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          DAYVIEW
        </text>

        {/* Current-time hand with amber counterweight */}
        {handGeom && (
          <g className="pointer-events-none">
            <line
              x1={handGeom.tx}
              y1={handGeom.ty}
              x2={handGeom.hx}
              y2={handGeom.hy}
              stroke="var(--dial-halo)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <line
              x1={center}
              y1={center}
              x2={handGeom.tx}
              y2={handGeom.ty}
              stroke="var(--dial-amber)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <line
              x1={center}
              y1={center}
              x2={handGeom.hx}
              y2={handGeom.hy}
              stroke="var(--dial-ink)"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <circle cx={center} cy={center} r={7} fill="var(--dial-ink)" />
            <circle cx={center} cy={center} r={3} fill="var(--dial-amber)" />
          </g>
        )}

        {/* Segment labels on top so the hand never hides them */}
        <g style={{ pointerEvents: 'none' }}>
          {segments.map((segment) => (
            <React.Fragment key={`label-${segment.segmentKey}`}>
              {renderSegmentText(segment)}
            </React.Fragment>
          ))}
        </g>
      </svg>
      {isTaskDialogOpen && editingTask && (
        <TaskDialog
          isOpen={isTaskDialogOpen}
          onClose={handleDialogClose}
          onSave={handleDialogSave}
          task={editingTask}
          categories={categories}
          onDelete={(taskId) => {
            const taskToDelete = { ...editingTask, isDeleted: true };
            onEditTask(taskToDelete);
            handleDialogClose();
          }}
        />
      )}
      {isAddDialogOpen && (
        <TaskDialog
          isOpen={isAddDialogOpen}
          onClose={() => { setIsAddDialogOpen(false); setAddInitialValues(null); }}
          onSave={handleDialogSave}
          task={null}
          categories={categories}
          onDelete={() => {}}
          isAdding
          initialValues={addInitialValues ?? undefined}
        />
      )}
    </div>
  );
};

// Удаляем дублирующий default export
