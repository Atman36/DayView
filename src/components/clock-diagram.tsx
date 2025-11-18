'use client';
import type { FC } from 'react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { Task, Category } from '@/types';
import { timeToAngle, getSegmentPath, isDarkColor, timeToAngle12 } from '@/utils/color';
import { TaskDialog } from './task-dialog';
import { format } from 'date-fns-tz';
import { TASK_NAME_SHORTENING } from '@/constants/task-name-shortening';

// Time constants
const MINUTES_PER_DAY = 1440;
const MINUTES_PER_12_HOURS = 720;
const DEFAULT_TASK_DURATION_MINUTES = 120; // 2 hours
const CURRENT_TIME_UPDATE_INTERVAL_MS = 300000; // 5 minutes
const TIME_SNAP_INTERVAL_MINUTES = 5; // Snap to 5-minute intervals
const MIN_TASK_DURATION_MINUTES = 5; // Minimum task duration

interface DragState {
  taskId: string;
  edge: 'start' | 'end';
  originalTask: Task;
}

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
  const radius = 160; 
  const center = 180; 
  const [isClient, setIsClient] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ taskId: string; edge: "start" | "end" } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addInitialValues, setAddInitialValues] = useState<Partial<Task> | null>(null);
  const [currentTimeAngle, setCurrentTimeAngle] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  // Snap time to nearest interval (e.g., 5 minutes)
  const snapToInterval = (minutes: number, interval: number = TIME_SNAP_INTERVAL_MINUTES): number => {
    return Math.round(minutes / interval) * interval;
  };

  const startMinuteAbs = useMemo(() => convertTimeToMinutes(startTime), [startTime]);

  // Convert angle (0-360) to minutes within the 12-hour clock
  const angleToMinutes = useCallback((angle: number): number => {
    // Angle 0° = 12:00, rotating clockwise
    // Convert to minutes within 12-hour period (0-720)
    const minutesIn12 = Math.round((angle / 360) * MINUTES_PER_12_HOURS) % MINUTES_PER_12_HOURS;

    // Map to 24-hour day based on current clock (day/night)
    const startAbs = startMinuteAbs;
    const base = Math.floor(startAbs / MINUTES_PER_12_HOURS) * MINUTES_PER_12_HOURS;

    const cand1 = (base + minutesIn12) % MINUTES_PER_DAY;
    const cand2 = (base + MINUTES_PER_12_HOURS + minutesIn12) % MINUTES_PER_DAY;

    const off1 = (cand1 - startAbs + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const off2 = (cand2 - startAbs + MINUTES_PER_DAY) % MINUTES_PER_DAY;

    return off1 < MINUTES_PER_12_HOURS ? cand1 : cand2;
  }, [startMinuteAbs]);

  // Get angle from mouse position on SVG
  const getMouseAngle = useCallback((e: React.MouseEvent<SVGElement>): number => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 360;
    const y = ((e.clientY - rect.top) / rect.height) * 370;
    const dx = x - center;
    const dy = y - center;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  }, [center]);

  const calculateAngle = useCallback((time: string): number => {
    return timeToAngle12(time); 
  }, []);

  const segments = useMemo(() => {
    if (!isClient) return []; 

    return tasks
      .map((task) => {
        const startAngle = calculateAngle(task.startTime);
        let endAngle = calculateAngle(task.endTime); 
        const color = getTaskColor(task.categoryName);

        let deltaAngle = endAngle - startAngle;
        if (deltaAngle <= 0) { 
            deltaAngle += 360;
        }

        const innerRadius = radius * 0.01; // Небольшой внутренний радиус
        const path = getSegmentPath(center, center, innerRadius, radius, startAngle, endAngle);

        let textAngle = (startAngle + deltaAngle / 2) % 360;

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
          isHovered: false // Add hover state
        };
      })
      .flat(); 
  }, [tasks, categories, categoryMap, center, radius, isClient]); 

  const hourMarkers = useMemo(() => {
    if (!isClient) return [];
    const markers: JSX.Element[] = [];
    const textOffset = 15; 
    const majorTickLength = 5;
    const minorTickLength = 3;
    const halfHourTickLength = 2;
    
    const displayHours: number[] = [];
    const specialHours: number[] = []; 
    
    if (isDayClock) {
        for (let h = 7; h < 18; h++) {
            if (h !== 12) { 
                displayHours.push(h);
            }
        }
        specialHours.push(6); 
        specialHours.push(12); 
    } else {
        for (let h = 19; h < 24; h++) displayHours.push(h);
        for (let h = 1; h < 6; h++) displayHours.push(h);
        
        specialHours.push(18); 
        specialHours.push(24); 
    }
    
    displayHours.forEach(hour24 => {
        const time = `${hour24.toString().padStart(2, '0')}:00`;
        const angle = calculateAngle(time);
        
        const isMajor = (hour24 % 3 === 0); 
        
        const x = center + (radius + textOffset) * Math.cos(((angle - 90) * Math.PI) / 180);
        let y = center + (radius + textOffset) * Math.sin(((angle - 90) * Math.PI) / 180);
        
        // Adjust positioning for top numbers to prevent clipping
        if ((hour24 === 12 && isDayClock) || (hour24 === 0 && !isDayClock)) {
            y += 3;
        }
        
        markers.push(
            <text
                key={`hour-label-${hour24}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11" 
                fontWeight={isMajor ? "bold" : "normal"}
                fill="hsl(var(--foreground))"
                opacity={isMajor ? "1" : "0.7"}
                style={{ paintOrder: 'stroke fill', stroke: 'white', strokeWidth: isMajor ? 0.8 : 0.4, strokeLinejoin: 'round' }}
            >
                {hour24.toString()}
            </text>
        );
        
        const tickLength = isMajor ? majorTickLength : minorTickLength;
        const markerRadius = radius + tickLength;
        const x1 = center + radius * Math.cos(((angle - 90) * Math.PI) / 180);
        const y1 = center + radius * Math.sin(((angle - 90) * Math.PI) / 180);
        const x2 = center + markerRadius * Math.cos(((angle - 90) * Math.PI) / 180);
        const y2 = center + markerRadius * Math.sin(((angle - 90) * Math.PI) / 180);
        
        markers.push(
            <line
                key={`hour-tick-${hour24}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--foreground))"
                opacity="0.5"
                strokeWidth={isMajor ? 1.5 : 1}
            />
        );
        
        const halfHourAngle = calculateAngle(`${hour24.toString().padStart(2, '0')}:30`);
        const hx1 = center + radius * Math.cos(((halfHourAngle - 90) * Math.PI) / 180);
        const hy1 = center + radius * Math.sin(((halfHourAngle - 90) * Math.PI) / 180);
        const hx2 = center + (radius + halfHourTickLength) * Math.cos(((halfHourAngle - 90) * Math.PI) / 180);
        const hy2 = center + (radius + halfHourTickLength) * Math.sin(((halfHourAngle - 90) * Math.PI) / 180);
        
        markers.push(
            <line
                key={`half-hour-${hour24}`}
                x1={hx1}
                y1={hy1}
                x2={hx2}
                y2={hy2}
                stroke="hsl(var(--foreground))"
                strokeWidth="0.5"
                opacity="0.4"
            />
        );
    });
    
    specialHours.forEach(hour24 => {
        const time = `${hour24.toString().padStart(2, '0')}:00`;
        const angle = calculateAngle(time);
        
        const specialOffset = textOffset + 2;
        let specialX = center + (radius + specialOffset) * Math.cos(((angle - 90) * Math.PI) / 180);
        let specialY = center + (radius + specialOffset) * Math.sin(((angle - 90) * Math.PI) / 180);
        
        if ((hour24 === 6 && isDayClock) || (hour24 === 18 && !isDayClock)) {
            specialY += 6; 
        } else if ((hour24 === 12 && isDayClock) || (hour24 === 24 && !isDayClock)) {
            specialY += 4; // Move numbers down to prevent clipping
        }
        
        markers.push(
            <text
                key={`special-hour-${hour24}-${isDayClock ? 'day' : 'night'}`}
                x={specialX}
                y={specialY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12" 
                fontWeight="bold"
                fill="hsl(var(--foreground))"
                opacity="1"
                style={{ paintOrder: 'stroke fill', stroke: 'white', strokeWidth: 0.8, strokeLinejoin: 'round' }}
            >
                {hour24.toString()}
            </text>
        );
        
        const tickLength = majorTickLength;
        const markerRadius = radius + tickLength;
        const x1 = center + radius * Math.cos(((angle - 90) * Math.PI) / 180);
        const y1 = center + radius * Math.sin(((angle - 90) * Math.PI) / 180);
        const x2 = center + markerRadius * Math.cos(((angle - 90) * Math.PI) / 180);
        const y2 = center + markerRadius * Math.sin(((angle - 90) * Math.PI) / 180);
        
        markers.push(
            <line
                key={`special-hour-tick-${hour24}-${isDayClock ? 'day' : 'night'}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--foreground))"
                opacity="0.6"
                strokeWidth={1.5}
            />
        );
    });
    
    return markers;
  }, [isDayClock, center, radius, isClient, calculateAngle]);

  // Drag & Drop handlers
  const handleEdgeMouseDown = (e: React.MouseEvent, task: Task, edge: 'start' | 'end') => {
    e.stopPropagation();
    setDragState({ taskId: task.id, edge, originalTask: task });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      // We need access to SVG element - will handle this in SVG event listeners
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragState]);

  const handleSVGMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !dragState) return;

    const angle = getMouseAngle(e);
    const newMinutes = snapToInterval(angleToMinutes(angle));
    const newTime = minutesToTime(newMinutes);

    const task = dragState.originalTask;
    const startMinutes = convertTimeToMinutes(task.startTime);
    const endMinutes = convertTimeToMinutes(task.endTime);

    let updatedTask: Task | null = null;

    if (dragState.edge === 'start') {
      // Check minimum duration
      const duration = (endMinutes - newMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      if (duration >= MIN_TASK_DURATION_MINUTES && duration <= MINUTES_PER_12_HOURS) {
        updatedTask = { ...task, startTime: newTime };
      }
    } else {
      // edge === 'end'
      const duration = (newMinutes - startMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      if (duration >= MIN_TASK_DURATION_MINUTES && duration <= MINUTES_PER_12_HOURS) {
        updatedTask = { ...task, endTime: newTime };
      }
    }

    if (updatedTask) {
      onEditTask(updatedTask);
      setDragState({ ...dragState, originalTask: updatedTask });
    }
  }, [isDragging, dragState, getMouseAngle, angleToMinutes, snapToInterval, minutesToTime, convertTimeToMinutes, onEditTask]);

  const handleSegmentClick = (e: React.MouseEvent, task: Task) => {
    if (isDragging) return; // Don't open dialog during drag
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

  const renderSegmentText = useCallback((segment: any) => {
    const textRadius = segment.innerRadius + (radius - segment.innerRadius) * 0.7;
    const approximateArcLength = segment.deltaAngle * (Math.PI / 180) * textRadius;
    const fontSize = 9; 
    const averageCharWidth = 5.5; 
    const maxTextWidth = approximateArcLength * 0.9;
    const charactersPerLine = Math.max(1, Math.floor(maxTextWidth / averageCharWidth));
    
    if (segment.deltaAngle < 8 || maxTextWidth < fontSize * 2) return null; // минимальный угол слегка увеличен

    const taskName = segment.name.toLowerCase();
    const shortenedName = TASK_NAME_SHORTENING[taskName] || taskName;
    
    const words = shortenedName.split(' ');
    
    const MAX_LINES = 3; 
    
    let displayLines: string[] = [];
    let currentLine = '';
    let lineCount = 0;
    let truncated = false;
    
    for (const word of words) {
      if (truncated) break;
      
      if (lineCount >= MAX_LINES) {
        truncated = true;
        break;
      }
      
      if (currentLine.length + word.length + (currentLine ? 1 : 0) <= charactersPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          displayLines.push(currentLine);
          lineCount++;
          if (lineCount >= MAX_LINES) {
            truncated = true;
            break;
          }
          currentLine = word;
        } else {
          currentLine = word.substring(0, charactersPerLine);
          truncated = true;
        }
      }
    }
    
    if (currentLine && lineCount < MAX_LINES) {
      displayLines.push(currentLine);
    }
    
    if (truncated && displayLines.length < MAX_LINES) {
      displayLines[displayLines.length - 1] += '...';
    }
    
    const midpointAngle = segment.startAngle + segment.deltaAngle / 2;
    
    const lineHeight = fontSize * 1.2;
    
    const textX = center + textRadius * Math.cos((midpointAngle - 90) * (Math.PI / 180));
    const textY = center + textRadius * Math.sin((midpointAngle - 90) * (Math.PI / 180));
    
    return displayLines.map((line, index) => {
      const lineOffset = (index - (displayLines.length - 1) / 2) * lineHeight;
      
      const textX = center + textRadius * Math.cos((midpointAngle - 90) * (Math.PI / 180));
      const textY = center + textRadius * Math.sin((midpointAngle - 90) * (Math.PI / 180)) + lineOffset;
      
      return (
        <text
          key={`segment-text-${segment.id}-${index}`}
          x={textX}
          y={textY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isDarkColor(segment.color) ? "#FFFFFF" : "#000000"}
          fontSize={fontSize}
          fontWeight="normal"
          opacity={segment.id === hoveredSegment ? 1 : 0.8}
        >
          {line}
        </text>
      );
    });
  }, [center, radius, hoveredSegment]);

  const currentTimeIndicator = currentTimeAngle !== null ? (
    <line
      x1={center}
      y1={center}
      x2={center + radius * Math.cos(((currentTimeAngle - 90) * Math.PI) / 180)}
      y2={center + radius * Math.sin(((currentTimeAngle - 90) * Math.PI) / 180)}
      stroke="hsl(var(--destructive))"
      strokeWidth="1.5"
      strokeDasharray="4 2"
      className="pointer-events-none"
    />
  ) : null;

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

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 360 370" className="w-full h-full" style={{ padding: '20px', cursor: isDragging ? 'grabbing' : 'default' }} onClick={handleBackgroundClick} onMouseMove={handleSVGMouseMove}>
        <defs>
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
        {segments.map((segment) => {
          // Calculate handle positions
          const handleRadius = 6;
          const handleOffset = radius * 0.85; // Position handles towards outer edge

          const startX = center + handleOffset * Math.cos(((segment.startAngle - 90) * Math.PI) / 180);
          const startY = center + handleOffset * Math.sin(((segment.startAngle - 90) * Math.PI) / 180);
          const endX = center + handleOffset * Math.cos(((segment.endAngle - 90) * Math.PI) / 180);
          const endY = center + handleOffset * Math.sin(((segment.endAngle - 90) * Math.PI) / 180);

          const isHoveringStart = hoveredEdge?.taskId === segment.id && hoveredEdge.edge === 'start';
          const isHoveringEnd = hoveredEdge?.taskId === segment.id && hoveredEdge.edge === 'end';
          const isDraggingThis = dragState?.taskId === segment.id;

          return (
            <g key={segment.id} data-segment-id={segment.id}>
              {/* Main segment path */}
              <path
                d={segment.path}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="0.5"
                className="transition-opacity duration-200 cursor-pointer"
                style={{ opacity: segment.id === hoveredSegment ? 0.8 : 1 }}
                onClick={(e) => segment.originalTask && handleSegmentClick(e, segment.originalTask)}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <title>{segment.name} — {segment.startTime}–{segment.endTime}</title>
              </path>

              {/* Segment text */}
              {renderSegmentText(segment)}

              {/* Start handle */}
              {segment.originalTask && (
                <circle
                  cx={startX}
                  cy={startY}
                  r={handleRadius}
                  fill={isHoveringStart || isDraggingThis ? 'hsl(var(--primary))' : 'white'}
                  stroke={segment.color}
                  strokeWidth={2}
                  className="cursor-grab active:cursor-grabbing transition-all duration-150"
                  style={{
                    opacity: isHoveringStart || isDraggingThis || hoveredSegment === segment.id ? 1 : 0,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }}
                  onMouseDown={(e) => handleEdgeMouseDown(e, segment.originalTask, 'start')}
                  onMouseEnter={() => setHoveredEdge({ taskId: segment.id, edge: 'start' })}
                  onMouseLeave={() => setHoveredEdge(null)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <title>Drag to adjust start time</title>
                </circle>
              )}

              {/* End handle */}
              {segment.originalTask && (
                <circle
                  cx={endX}
                  cy={endY}
                  r={handleRadius}
                  fill={isHoveringEnd || isDraggingThis ? 'hsl(var(--primary))' : 'white'}
                  stroke={segment.color}
                  strokeWidth={2}
                  className="cursor-grab active:cursor-grabbing transition-all duration-150"
                  style={{
                    opacity: isHoveringEnd || isDraggingThis || hoveredSegment === segment.id ? 1 : 0,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }}
                  onMouseDown={(e) => handleEdgeMouseDown(e, segment.originalTask, 'end')}
                  onMouseEnter={() => setHoveredEdge({ taskId: segment.id, edge: 'end' })}
                  onMouseLeave={() => setHoveredEdge(null)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <title>Drag to adjust end time</title>
                </circle>
              )}
            </g>
          );
        })}
        {hourMarkers}
        {currentTimeAngle !== null && (
          <line
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(((currentTimeAngle - 90) * Math.PI) / 180)}
            y2={center + radius * Math.sin(((currentTimeAngle - 90) * Math.PI) / 180)}
            stroke="hsl(var(--destructive))"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            className="pointer-events-none"
          />
        )}
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