'use client';
import type { FC } from 'react';
import React, { useMemo, useState, useEffect, useCallback, memo } from 'react';
import type { Task, Category } from '@/types';
import { timeToAngle, getSegmentPath, isDarkColor, timeToAngle12 } from '@/utils/color';
import { TaskDialog } from './task-dialog'; 
import { format } from 'date-fns-tz'; 

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

// Типографическая система с адаптивными размерами
const TYPOGRAPHY = {
  timeLabels: {
    major: { size: 16, weight: 600, opacity: 1 },
    regular: { size: 14, weight: 500, opacity: 0.9 },
    minor: { size: 12, weight: 400, opacity: 0.6 }
  },
  taskText: {
    getSize: (angleSpan: number) => {
      const minSize = 11;
      const maxSize = 14;
      return Math.min(maxSize, minSize + angleSpan * 0.02);
    }
  }
};

// Оптимизированный компонент для временных меток
const TimeMarkers = memo<{
  isDayClock: boolean;
  center: number;
  radius: number;
  calculateAngle: (time: string) => number;
}>(({ isDayClock, center, radius, calculateAngle }) => {
  const markers = useMemo(() => {
    const result: JSX.Element[] = [];
    const textOffset = 20;
    const majorTickLength = 8;
    const minorTickLength = 4;
    
    // Определяем ключевые часы для отображения
    const keyHours = isDayClock 
      ? [6, 9, 12, 15, 18]
      : [18, 21, 0, 3, 6];
    
    // Все часы для тиков
    const allHours = isDayClock
      ? Array.from({ length: 12 }, (_, i) => i + 6)
      : [...Array.from({ length: 6 }, (_, i) => i + 18), ...Array.from({ length: 6 }, (_, i) => i)];
    
    allHours.forEach(hour24 => {
      const normalizedHour = hour24 >= 24 ? 0 : hour24;
      const time = `${normalizedHour.toString().padStart(2, '0')}:00`;
      const angle = calculateAngle(time);
      
      const isKeyHour = keyHours.includes(normalizedHour);
      const isMajor = normalizedHour % 6 === 0;
      
      // Рисуем тики для всех часов
      const tickLength = isKeyHour ? majorTickLength : minorTickLength;
      const x1 = center + radius * Math.cos(((angle - 90) * Math.PI) / 180);
      const y1 = center + radius * Math.sin(((angle - 90) * Math.PI) / 180);
      const x2 = center + (radius + tickLength) * Math.cos(((angle - 90) * Math.PI) / 180);
      const y2 = center + (radius + tickLength) * Math.sin(((angle - 90) * Math.PI) / 180);
      
      result.push(
        <line
          key={`tick-${hour24}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="hsl(var(--foreground))"
          strokeWidth={isKeyHour ? 2 : 1}
          opacity={isKeyHour ? 0.8 : 0.3}
        />
      );
      
      // Показываем только ключевые метки времени
      if (isKeyHour) {
        const style = isMajor ? TYPOGRAPHY.timeLabels.major : TYPOGRAPHY.timeLabels.regular;
        const x = center + (radius + textOffset) * Math.cos(((angle - 90) * Math.PI) / 180);
        const y = center + (radius + textOffset) * Math.sin(((angle - 90) * Math.PI) / 180);
        
        result.push(
          <text
            key={`label-${hour24}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={style.size}
            fontWeight={style.weight}
            fill="hsl(var(--foreground))"
            opacity={style.opacity}
            className="select-none"
          >
            {normalizedHour}
          </text>
        );
      }
    });
    
    return result;
  }, [isDayClock, center, radius, calculateAngle]);
  
  return <g className="time-markers">{markers}</g>;
});

TimeMarkers.displayName = 'TimeMarkers';

// Оптимизированный компонент для отображения текста задач
const TaskText = memo<{
  segment: any;
  center: number;
  radius: number;
  hoveredSegment: string | null;
}>(({ segment, center, radius, hoveredSegment }) => {
  const textContent = useMemo(() => {
    const textRadius = segment.innerRadius + (radius - segment.innerRadius) * 0.65;
    const fontSize = TYPOGRAPHY.taskText.getSize(segment.deltaAngle);
    
    // Минимальный угол для отображения текста
    if (segment.deltaAngle < 8) return null;
    
    // Интеллектуальное сокращение названий
    const getShortName = (name: string, maxLength: number) => {
      if (name.length <= maxLength) return name;
      
      // Приоритетные слова
      const priorityWords = ['работа', 'обучение', 'планирование', 'отдых'];
      const words = name.toLowerCase().split(/\s+/);
      
      const importantWord = words.find(w => priorityWords.some(p => w.includes(p)));
      if (importantWord) {
        return importantWord.charAt(0).toUpperCase() + importantWord.slice(1);
      }
      
      // Возвращаем первое слово с многоточием
      return words[0].charAt(0).toUpperCase() + words[0].slice(1) + '...';
    };
    
    const maxChars = Math.floor(segment.deltaAngle * 0.8);
    const displayName = getShortName(segment.name, maxChars);
    
    const midpointAngle = segment.startAngle + segment.deltaAngle / 2;
    const x = center + textRadius * Math.cos((midpointAngle - 90) * (Math.PI / 180));
    const y = center + textRadius * Math.sin((midpointAngle - 90) * (Math.PI / 180));
    
    // Определяем нужно ли поворачивать текст
    const needsRotation = midpointAngle > 90 && midpointAngle < 270;
    const rotation = needsRotation ? midpointAngle + 180 : midpointAngle;
    
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isDarkColor(segment.color) ? "#FFFFFF" : "#000000"}
        fontSize={fontSize}
        fontWeight="500"
        opacity={segment.id === hoveredSegment ? 1 : 0.85}
        transform={`rotate(${rotation} ${x} ${y})`}
        className="select-none pointer-events-none"
        style={{ 
          filter: isDarkColor(segment.color) ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none',
          transition: 'opacity 0.2s ease'
        }}
      >
        {displayName}
      </text>
    );
  }, [segment, center, radius, hoveredSegment]);
  
  return textContent;
});

TaskText.displayName = 'TaskText';

export const ClockDiagramOptimized: FC<ClockDiagramProps> = ({
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentTimeAngle, setCurrentTimeAngle] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<{x: number, y: number, task: Task} | null>(null);

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
    const intervalId = setInterval(updateCurrentTime, 300000); 
    return () => clearInterval(intervalId); 
  }, [timezone, startTime, endTime]); 

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.name] = category.color;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const getTaskColor = useCallback((categoryName: string): string => {
    return categoryMap[categoryName] || '#cccccc'; 
  }, [categoryMap]);

  const calculateAngle = useCallback((time: string): number => {
    return timeToAngle12(time); 
  }, []);

  const segments = useMemo(() => {
    if (!isClient) return []; 

    return tasks.map((task) => {
      const startAngle = calculateAngle(task.startTime);
      let endAngle = calculateAngle(task.endTime); 
      const color = getTaskColor(task.categoryName);

      let deltaAngle = endAngle - startAngle;
      if (deltaAngle <= 0) { 
          deltaAngle += 360;
      }

      const innerRadius = radius * 0.15; // Увеличенный внутренний радиус для лучшей видимости
      const path = getSegmentPath(center, center, innerRadius, radius, startAngle, endAngle);

      return {
        ...task,
        path,
        color,
        originalTask: task, 
        deltaAngle: deltaAngle, 
        startAngle: startAngle,
        endAngle: endAngle, 
        innerRadius: innerRadius,
      };
    });
  }, [tasks, categories, categoryMap, center, radius, isClient, calculateAngle, getTaskColor]); 

  const handleSegmentClick = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  }, []);

  const handleSegmentHover = useCallback((event: React.MouseEvent, task: Task | null) => {
    if (task) {
      setHoveredSegment(task.id);
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipData({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        task
      });
      setShowTooltip(true);
    } else {
      setHoveredSegment(null);
      setShowTooltip(false);
      setTooltipData(null);
    }
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  }, []);

  const handleDialogSave = useCallback((updatedTask: Task | Omit<Task, "id">) => {
    onEditTask(updatedTask as Task);
    handleDialogClose();
  }, [onEditTask, handleDialogClose]);

  if (!isClient) {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground">Загрузка часов...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 360 370" className="w-full h-full" style={{ padding: '10px' }}>
        <defs>
          {/* Улучшенные фильтры для теней */}
          <filter id="segment-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feFlood floodColor="#000000" floodOpacity="0.1" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Градиент для текущего времени */}
          <linearGradient id="current-time-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        
        {/* Фоновый круг */}
        <circle 
          cx={center} 
          cy={center} 
          r={radius} 
          fill="none" 
          stroke="hsl(var(--border))" 
          strokeWidth="1" 
          opacity="0.3"
        />
        
        {/* Внутренний круг */}
        <circle 
          cx={center} 
          cy={center} 
          r={radius * 0.15} 
          fill="hsl(var(--background))" 
          stroke="hsl(var(--border))" 
          strokeWidth="1" 
          opacity="0.5"
        />
        
        {/* Сегменты задач */}
        <g className="task-segments">
          {segments.map((segment) => (
            <g 
              key={segment.id} 
              onClick={() => segment.originalTask && handleSegmentClick(segment.originalTask)} 
              onMouseEnter={(e) => handleSegmentHover(e, segment.originalTask)}
              onMouseLeave={(e) => handleSegmentHover(e, null)}
              className="cursor-pointer"
              style={{ transition: 'all 0.2s ease' }}
            >
              <path 
                d={segment.path} 
                fill={segment.color} 
                stroke="hsl(var(--background))" 
                strokeWidth="1.5" 
                filter="url(#segment-shadow)"
                style={{ 
                  opacity: hoveredSegment && hoveredSegment !== segment.id ? 0.6 : 1,
                  transform: hoveredSegment === segment.id ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: `${center}px ${center}px`,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
              <TaskText 
                segment={segment} 
                center={center} 
                radius={radius} 
                hoveredSegment={hoveredSegment} 
              />
            </g>
          ))}
        </g>
        
        {/* Временные метки */}
        <TimeMarkers 
          isDayClock={isDayClock} 
          center={center} 
          radius={radius} 
          calculateAngle={calculateAngle} 
        />
        
        {/* Индикатор текущего времени */}
        {currentTimeAngle !== null && (
          <g className="current-time-indicator">
            <line
              x1={center}
              y1={center}
              x2={center + radius * 0.9 * Math.cos(((currentTimeAngle - 90) * Math.PI) / 180)}
              y2={center + radius * 0.9 * Math.sin(((currentTimeAngle - 90) * Math.PI) / 180)}
              stroke="url(#current-time-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              className="pointer-events-none"
              style={{
                filter: 'drop-shadow(0 0 4px hsl(var(--destructive) / 0.5))'
              }}
            />
            <circle
              cx={center}
              cy={center}
              r="4"
              fill="hsl(var(--destructive))"
              className="pointer-events-none"
            />
          </g>
        )}
      </svg>
      
      {/* Tooltip */}
      {showTooltip && tooltipData && (
        <div
          className="absolute bg-popover text-popover-foreground p-3 rounded-lg shadow-lg pointer-events-none z-50"
          style={{
            left: tooltipData.x + 10,
            top: tooltipData.y - 10,
            transform: 'translateY(-100%)',
            minWidth: '200px',
            border: '1px solid hsl(var(--border))',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'hsl(var(--popover) / 0.95)'
          }}
        >
          <h4 className="font-semibold text-sm mb-1">{tooltipData.task.name}</h4>
          <p className="text-xs text-muted-foreground mb-1">
            {tooltipData.task.startTime} - {tooltipData.task.endTime}
          </p>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getTaskColor(tooltipData.task.categoryName) }}
            />
            <span className="text-xs">{tooltipData.task.categoryName}</span>
          </div>
        </div>
      )}
      
      {/* Диалог редактирования */}
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
    </div>
  );
};