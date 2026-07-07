
"use client";

import React, { useState, useEffect } from 'react';
import { ClockDiagram } from '@/components/clock-diagram';
import { TaskChecklist } from '@/components/task-checklist';
import { SettingsDialog } from '@/components/settings-dialog';
import { TaskDialog } from '@/components/task-dialog';
import { DayStats } from '@/components/day-stats';
import { CurrentTaskWidget } from '@/components/current-task-widget';
import type { Task, Category } from '@/types';
import { generateMarkdown } from '@/utils/markdown';
import { clipToWindow } from '@/utils/time-window';
import { Button } from '@/components/ui/button';
import { Settings, Upload, Download, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useScheduleData } from '@/hooks/use-schedule-data';
import { useFileOperations } from '@/hooks/use-file-operations';
import { useTranslation } from '@/hooks/use-translation';


export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [nowText, setNowText] = useState<string>('');
  const [dateText, setDateText] = useState<string>('');
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation();

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
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = stored ? stored as 'light' | 'dark' : (prefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
    }
  }, []);

  // Live header clock + date, in the selected timezone/language
  useEffect(() => {
    if (!isClient) return;
    const locale = language === 'ru' ? 'ru-RU' : 'en-US';
    const update = () => {
      const now = new Date();
      try {
        setNowText(new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone }).format(now));
        setDateText(new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long', timeZone: timezone }).format(now));
      } catch {
        setNowText(new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(now));
        setDateText(new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long' }).format(now));
      }
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [isClient, language, timezone]);

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

  // Membership = non-empty overlap with the dial's own 12h window (360 = day 06:00-18:00,
  // 1080 = night 18:00-06:00). A task touching a boundary only belongs to one dial.
  const dayTasks = tasks.filter(task => clipToWindow(task.startTime, task.endTime, 360).length > 0);
  const nightTasks = tasks.filter(task => clipToWindow(task.startTime, task.endTime, 1080).length > 0);

  if (!isClient) {
    return <div className="flex justify-center items-center h-screen">{t.loading}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1240px] xl:max-w-[1400px] 2xl:max-w-[1640px] mx-auto px-4 md:px-8 py-5">
        {/* Header */}
        <header className="flex items-center gap-x-4 gap-y-3 flex-wrap pb-4 mb-6 border-b border-border">
          <div className="flex items-baseline gap-3">
            <span className="font-mono font-semibold text-[15px] tracking-[0.3em]">DAYVIEW</span>
            <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground capitalize">{dateText}</span>
          </div>

          <div className="flex-1 min-w-[8px]" />

          {/* Live clock */}
          <div className="flex items-center gap-2 mr-1">
            <span className="w-[7px] h-[7px] rounded-full bg-primary" />
            <span className="font-mono text-lg tabular-nums">{nowText}</span>
          </div>

          {/* Language pills */}
          <div className="flex border border-border rounded-full overflow-hidden">
            {(['en', 'ru'] as const).map((lng) => (
              <button
                key={lng}
                onClick={() => setLanguage(lng)}
                className={`px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] transition-colors ${
                  language === lng ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            aria-label={theme === 'dark' ? t.lightTheme : t.darkTheme}
            onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
            className="w-[34px] h-[34px] rounded-full border border-border bg-card text-foreground grid place-items-center flex-none hover:bg-accent transition-colors"
          >
            <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true">
              <circle r="6.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M 0 -6.3 A 6.3 6.3 0 0 1 0 6.3 Z" fill="currentColor" />
            </svg>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="default"
              size="icon"
              className="rounded-full h-[34px] w-[34px]"
              onClick={() => { setIsTaskDialogOpen(true); setEditingTask(null); }}
              title={t.addTask}
            >
              <span className="sr-only">{t.addTask}</span>
              <Plus className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-[34px] w-[34px]" onClick={() => document.getElementById('import-input')?.click()} title={`${t.import} Markdown`}>
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
            <Button variant="outline" size="icon" className="rounded-full h-[34px] w-[34px]" onClick={() => handleExport(markdownContent)} title={`${t.export} Markdown`}>
              <Download className="h-4 w-4" />
              <span className="sr-only">{t.export}</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-[34px] w-[34px]" onClick={() => setIsSettingsOpen(true)} title={t.settings}>
              <Settings className="h-4 w-4" />
              <span className="sr-only">{t.settings}</span>
            </Button>
          </div>
        </header>

        {/* Dials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 2xl:gap-12 justify-items-center mb-6">
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="w-full max-w-[460px] xl:max-w-[540px] 2xl:max-w-[640px] aspect-square">
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
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
              {t.dayLabel} · 06:00–18:00
            </div>
          </div>
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="w-full max-w-[460px] xl:max-w-[540px] 2xl:max-w-[640px] aspect-square">
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
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
              {t.nightLabel} · 18:00–06:00
            </div>
          </div>
        </div>

        {/* Info columns, pressed to the dials */}
        <div className="grid grid-cols-1 lg:grid-cols-[19rem_1fr_19rem] 2xl:grid-cols-[22rem_1fr_22rem] gap-3 items-stretch">
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

          <div className="rounded-md border border-border bg-card p-4 flex flex-col h-full min-h-[220px]">
            <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground pb-1">{t.tasks}</span>
            <ScrollArea className="flex-1 max-h-[360px] pr-2 -mr-2">
              <TaskChecklist
                tasks={tasks}
                categories={categories}
                onUpdateTask={handleTaskUpdate}
                onDeleteTask={handleTaskDelete}
                onAddTask={handleTaskAdd}
              />
            </ScrollArea>
          </div>

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
      </div>

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

      {/* Task Dialog for adding new tasks from the header Plus button */}
      {isTaskDialogOpen && (
        <TaskDialog
          isOpen={isTaskDialogOpen}
          onClose={() => setIsTaskDialogOpen(false)}
          onSave={(newTaskData: Task | Omit<Task, 'id'>) => {
            if ('id' in newTaskData) {
              handleTaskUpdate(newTaskData as Task);
            } else {
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
