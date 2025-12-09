
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { ClockDiagram } from '@/components/clock-diagram';
import { TaskChecklist } from '@/components/task-checklist';
import { SettingsDialog } from '@/components/settings-dialog';
import { TaskDialog } from '@/components/task-dialog';
import { DayStats } from '@/components/day-stats';
import { CurrentTaskWidget } from '@/components/current-task-widget';
import type { Task, Category } from '@/types';
import { parseMarkdown, generateMarkdown } from '@/utils/markdown';
import { Button } from '@/components/ui/button';
import { Settings, Upload, Download, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useScheduleData } from '@/hooks/use-schedule-data';
import { useFileOperations } from '@/hooks/use-file-operations';
import { useTranslation } from '@/hooks/use-translation';


const DEFAULT_TIMEZONE = 'Asia/Yekaterinburg';


export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { toast } = useToast();
  const { t, generateDefaultMarkdown } = useTranslation();
  
  const {
    tasks,
    categories,
    markdownContent,
    timezone,
    handleTaskAdd,
    handleTaskUpdate,
    handleTaskDelete,
    updateTimezone,
    setCategories,
    updateDataFromMarkdown
  } = useScheduleData();
  
  // Обработчики для совместимости с существующим кодом
  const handleCategoriesUpdate = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    const newMarkdown = generateMarkdown(tasks, updatedCategories);
    updateDataFromMarkdown(newMarkdown);
  };
  
  const handleTimezoneChange = (newTimezone: string) => {
    updateTimezone(newTimezone);
    toast({
      title: t.success,
      description: `${t.timezoneUpdated} ${newTimezone}.`,
    });
  };
  
  const { handleImport, handleExport } = useFileOperations();

  useEffect(() => {
    setIsClient(true);
    // Initialize theme from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = stored ? stored as 'light' | 'dark' : (prefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };


  const dayTasks = tasks.filter(task => {
    const startHour = parseInt(task.startTime.split(':')[0]);
    const endHour = parseInt(task.endTime.split(':')[0]);
    const endMinute = parseInt(task.endTime.split(':')[1]);
    // Include tasks that start between 6:00 and 17:59
    // Also include tasks that cross the 18:00 boundary (start before 18:00, end after 18:00)
    // Handle midnight crossing for day clock (e.g. 22:00 - 02:00 is not on day clock unless split)
     if (startHour >= 6 && startHour < 18) return true;
     // Case: Starts before 6 AM, ends after 6 AM
     if (startHour < 6 && (endHour > 6 || (endHour === 6 && endMinute > 0))) return true;
     // Case: Starts before 6 PM, ends after 6 PM
     if (startHour < 18 && (endHour >= 18 || endHour < startHour)) return true; // endHour < startHour handles midnight crossing ending before 6 AM
     return false;
  });

  const nightTasks = tasks.filter(task => {
    const startHour = parseInt(task.startTime.split(':')[0]);
    const endHour = parseInt(task.endTime.split(':')[0]);
    const endMinute = parseInt(task.endTime.split(':')[1]);
    
    // Проверка на задачу планирования (17:00-18:00), которая дублируется
    // Если задача начинается в 17:00 и заканчивается в 18:00, показываем её только на дневной диаграмме
    if (startHour === 17 && endHour === 18 && endMinute === 0) return false;
    
    // Include tasks starting between 18:00 and 05:59
    if (startHour >= 18 || startHour < 6) return true;
    // Case: Starts before 6 PM, ends after 6 PM
    if (startHour < 18 && (endHour >= 18 || endHour < 6)) return true; // endHour < 6 handles midnight crossing
    // Case: Starts before 6 AM, ends after 6 AM (needs to be shown partially)
    if (startHour < 6 && (endHour > 6 || (endHour === 6 && endMinute > 0))) return true;
    return false;
  });


  if (!isClient) {
    // Render placeholder or loading state on the server
    return <div className="flex justify-center items-center h-screen">{t.loading}</div>;
  }


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">DayView</h1>
        <div className="flex gap-2 items-center">
          <Button 
            variant="default" 
            size="icon" 
            onClick={() => {
              // Open task dialog in add mode
              setIsTaskDialogOpen(true);
              // Pass null as task to indicate we're adding a new task
              setEditingTask(null);
            }} 
            title={t.addTask}
          >
            <span className="sr-only">{t.addTask}</span>
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => document.getElementById('import-input')?.click()} title={`${t.import} Markdown`}>
            <Upload className="h-4 w-4" />
            <span className="sr-only">{t.import}</span>
          </Button>
          <input 
            id="import-input" 
            type="file" 
            accept=".md" 
            onChange={(e) => handleImport(e, updateDataFromMarkdown)} 
            className="hidden" 
          />
          <Button variant="outline" size="icon" onClick={() => handleExport(markdownContent)} title={`${t.export} Markdown`}>
            <Download className="h-4 w-4" />
            <span className="sr-only">{t.export}</span>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} title={t.settings}>
            <Settings className="h-4 w-4" />
            <span className="sr-only">{t.settings}</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8 flex-grow">
        <Card className="aspect-square w-full flex items-center justify-center">
          <CardContent className="p-2 md:p-6 w-full h-full flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center max-w-[90vw] max-h-[90vw] aspect-square">
              <ClockDiagram
                startTime="06:00"
                endTime="18:00"
                tasks={dayTasks}
                categories={categories}
                isDayClock={true}
                timezone={timezone}
                onAddTask={(task) => handleTaskAdd(task)}
                onEditTask={handleTaskUpdate}
                onDeleteTask={handleTaskDelete}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="aspect-square w-full flex items-center justify-center">
          <CardContent className="p-2 md:p-6 w-full h-full flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center max-w-[90vw] max-h-[90vw] aspect-square">
              <ClockDiagram
                startTime="18:00"
                endTime="06:00"
                tasks={nightTasks}
                categories={categories}
                isDayClock={false}
                timezone={timezone}
                onAddTask={(task) => handleTaskAdd(task)}
                onEditTask={handleTaskUpdate}
                onDeleteTask={handleTaskDelete}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Task and Day Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <CurrentTaskWidget
          tasks={tasks}
          categories={categories}
          timezone={timezone}
          translations={{
            currentTask: t.currentTask,
            nextTask: t.nextTask,
            noCurrentTask: t.noCurrentTask,
            endsIn: t.endsIn,
            startsIn: t.startsIn,
          }}
        />
        <DayStats
          tasks={tasks}
          categories={categories}
          translations={{
            dayFillness: t.dayFillness,
            conflicts: t.conflicts,
            categoryBreakdown: t.categoryBreakdown,
            hours: t.hours,
            minutes: t.minutes,
          }}
        />
      </div>

      <Card className="flex-shrink-0">
        <CardContent className="p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">{t.taskList}</h2>
          <ScrollArea className="h-[350px] md:h-[450px]">
            <TaskChecklist
              tasks={tasks}
              categories={categories}
              onUpdateTask={handleTaskUpdate}
              onDeleteTask={handleTaskDelete}
              onAddTask={handleTaskAdd} // Pass the add handler
            />
          </ScrollArea>
        </CardContent>
      </Card>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        markdownContent={markdownContent}
        onMarkdownChange={updateDataFromMarkdown}
        categories={categories}
        onCategoriesChange={handleCategoriesUpdate}
        timezone={timezone}
        onTimezoneChange={handleTimezoneChange}
        theme={theme}
        onThemeChange={handleThemeChange}
      />
      
      {/* Task Dialog for adding new tasks from the top Plus button */}
      {isTaskDialogOpen && (
        <TaskDialog
          isOpen={isTaskDialogOpen}
          onClose={() => setIsTaskDialogOpen(false)}
          onSave={(newTaskData: Task | Omit<Task, 'id'>) => {
            if ('id' in newTaskData) {
              // Editing existing task
              handleTaskUpdate(newTaskData as Task);
            } else {
              // Adding new task
              handleTaskAdd(newTaskData as Omit<Task, 'id'>);
            }
            setIsTaskDialogOpen(false);
          }}
          task={editingTask}
          categories={categories}
          onDelete={handleTaskDelete}
          isAdding={editingTask === null}
        />
      )}
    </div>
  );
}
