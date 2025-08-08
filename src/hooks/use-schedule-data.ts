import { useState, useEffect, useCallback } from 'react';
import type { Task, Category } from '@/types';
import { parseMarkdown, generateMarkdown } from '@/utils/markdown';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';


const DEFAULT_TIMEZONE = 'Asia/Yekaterinburg';

export function useScheduleData() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [timezone, setTimezone] = useState<string>(DEFAULT_TIMEZONE);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const { t, generateDefaultMarkdown } = useTranslation();

  // Инициализация данных из localStorage
  useEffect(() => {
    setIsClient(true);
    
    // Load data from localStorage or use default values
    const savedMarkdown = localStorage.getItem('scheduleMarkdown');
    const defaultMarkdown = generateDefaultMarkdown();
    const hasSaved = typeof savedMarkdown === 'string' && savedMarkdown.trim().length > 0;
    const initialMarkdown = hasSaved ? (savedMarkdown as string) : defaultMarkdown;
    setMarkdownContent(initialMarkdown);
    if (!hasSaved) {
      // Seed storage on first run or if previous value was empty
      localStorage.setItem('scheduleMarkdown', defaultMarkdown);
    }

    const savedTimezone = localStorage.getItem('scheduleTimezone');
    setTimezone(savedTimezone || DEFAULT_TIMEZONE);

    try {
      const { tasks: parsedTasks, categories: parsedCategories } = parseMarkdown(initialMarkdown);
      setTasks(parsedTasks);
      setCategories(parsedCategories);
    } catch (error) {
      console.error('Error parsing initial markdown:', error);
      toast({
        title: t.parseErrorTitle,
        description: t.parseErrorDescription,
        variant: 'destructive',
      });
      
      // Fallback to default values on parsing error
      const fallbackMarkdown = generateDefaultMarkdown();
      const { tasks: defaultTasks, categories: defaultCategories } = parseMarkdown(fallbackMarkdown);
      setTasks(defaultTasks);
      setCategories(defaultCategories);
      setMarkdownContent(fallbackMarkdown);
      localStorage.setItem('scheduleMarkdown', fallbackMarkdown);
    }
  }, [toast, t, generateDefaultMarkdown]);

  // Обновление данных из Markdown
  const updateDataFromMarkdown = useCallback((newMarkdown: string) => {
    try {
      const { tasks: parsedTasks, categories: parsedCategories } = parseMarkdown(newMarkdown);
      setTasks(parsedTasks);
      setCategories(parsedCategories);
      setMarkdownContent(newMarkdown);
      localStorage.setItem('scheduleMarkdown', newMarkdown);
      toast({
        title: t.success,
        description: t.scheduleUpdated,
      });
    } catch (error) {
      console.error('Error parsing markdown:', error);
      toast({
        title: t.parseErrorTitle,
        description: t.parseErrorDescription,
        variant: 'destructive',
      });
    }
  }, [toast, t]);

  // Обновление задачи
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    // Проверяем, является ли это операцией удаления
    if ('isDeleted' in updatedTask && (updatedTask as any).isDeleted) {
      handleTaskDelete(updatedTask.id);
      return;
    }
    
    const updatedTasks = tasks.map(task => task.id === updatedTask.id ? updatedTask : task);
    setTasks(updatedTasks);
    const newMarkdown = generateMarkdown(updatedTasks, categories);
    updateDataFromMarkdown(newMarkdown);
  }, [tasks, categories, updateDataFromMarkdown]);

  // Добавление новой задачи
  const handleTaskAdd = useCallback((newTask: Omit<Task, 'id'>) => {
    const newId = Date.now().toString(); // Простая генерация ID
    const taskWithId: Task = { ...newTask, id: newId };
    const updatedTasks = [...tasks, taskWithId];
    
    // Сортируем задачи по времени начала
    updatedTasks.sort((a, b) => {
      const timeA = parseInt(a.startTime.replace(':', ''), 10);
      const timeB = parseInt(b.startTime.replace(':', ''), 10);
      return timeA - timeB;
    });
    
    setTasks(updatedTasks);
    const newMarkdown = generateMarkdown(updatedTasks, categories);
    updateDataFromMarkdown(newMarkdown);
  }, [tasks, categories, updateDataFromMarkdown]);

  // Удаление задачи
  const handleTaskDelete = useCallback((taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    const newMarkdown = generateMarkdown(updatedTasks, categories);
    updateDataFromMarkdown(newMarkdown);
  }, [tasks, categories, updateDataFromMarkdown]);

  // Обновление часового пояса
  const updateTimezone = useCallback((newTimezone: string) => {
    setTimezone(newTimezone);
    localStorage.setItem('scheduleTimezone', newTimezone);
  }, []);

  return {
    // Состояние
    tasks,
    categories,
    markdownContent,
    timezone,
    isClient,
    
    // Методы
    updateDataFromMarkdown,
    handleTaskUpdate,
    handleTaskAdd,
    handleTaskDelete,
    updateTimezone,
    setCategories,
  };
}