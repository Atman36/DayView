'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ru';

interface Translation {
  // Main page
  taskList: string;
  addTask: string;
  import: string;
  export: string;
  settings: string;
  loading: string;
  
  // Settings dialog
  settingsTitle: string;
  settingsDescription: string;
  timezone: string;
  selectTimezone: string;
  markdownEditor: string;
  saveMarkdown: string;
  categoryManagement: string;
  addCategory: string;
  saveCategories: string;
  removeCategory: string;
  categoryName: string;
  close: string;
  theme: string;
  language: string;
  lightTheme: string;
  darkTheme: string;
  
  // Task dialog
  newTask: string;
  editTask: string;
  fillTaskDetails: string;
  makeTaskChanges: string;
  name: string;
  start: string;
  end: string;
  category: string;
  status: string;
  selectCategory: string;
  selectStatus: string;
  inProgress: string;
  completed: string;
  delete: string;
  cancel: string;
  save: string;
  
  // Task checklist
  noTasksDisplay: string;
  editTaskSr: string;
  deleteTaskSr: string;
  
  // Messages and notifications
  success: string;
  scheduleUpdated: string;
  parseErrorTitle: string;
  parseErrorDescription: string;
  timezoneUpdated: string;
  pleaseCompleteFields: string;
  newCategory: string;
  notSpecified: string;
  fileExported: string;
  exportError: string;
  exportErrorDescription: string;

  // Default markdown content
  daySchedule: string;
  categories: string;
  tasks: string;
  spiritualDevelopment: string;
  mainTasks: string;
  restFood: string;
  planning: string;
  learning: string;
  sleep: string;
  physicalActivity: string;
  reading: string;
  
  // Default tasks
  morningRoutine: string;
  morningPractices: string;
  breakfastReading: string;
  workBlock1: string;
  lunchRest: string;
  workBlock2: string;
  learningTime: string;
  physicalActivityTime: string;
  planningTomorrow: string;
  dinner: string;
  freeTimeReading: string;
  eveningRoutine: string;
  sleepTime: string;
  
  // Day stats
  dayFillness: string;
  conflicts: string;
  categoryBreakdown: string;
  hours: string;
  minutes: string;
  
  // Current task widget
  currentTask: string;
  nextTask: string;
  noCurrentTask: string;
  endsIn: string;
  startsIn: string;
  dayStats: string;
}

const translations: Record<Language, Translation> = {
  en: {
    // Main page
    taskList: 'Task List',
    addTask: 'Add Task',
    import: 'Import',
    export: 'Export',
    settings: 'Settings',
    loading: 'Loading...',
    
    // Settings dialog
    settingsTitle: 'Settings',
    settingsDescription: 'Edit schedule, categories and timezone.',
    timezone: 'Timezone',
    selectTimezone: 'Select timezone',
    markdownEditor: 'Markdown Editor',
    saveMarkdown: 'Save Markdown',
    categoryManagement: 'Category Management',
    addCategory: 'Add Category',
    saveCategories: 'Save Categories',
    removeCategory: 'Remove category',
    categoryName: 'Category name',
    close: 'Close',
    theme: 'Theme',
    language: 'Language',
    lightTheme: 'Light theme',
    darkTheme: 'Dark theme',
    
    // Task dialog
    newTask: 'New Task',
    editTask: 'Edit Task',
    fillTaskDetails: 'Fill in the details of the new task.',
    makeTaskChanges: 'Make changes to the task.',
    name: 'Name',
    start: 'Start',
    end: 'End',
    category: 'Category',
    status: 'Status',
    selectCategory: 'Select category',
    selectStatus: 'Select status',
    inProgress: '⏳ In Progress',
    completed: '✅ Completed',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    
    // Task checklist
    noTasksDisplay: 'No tasks to display.',
    editTaskSr: 'Edit Task',
    deleteTaskSr: 'Delete Task',
    
    // Messages and notifications
    success: 'Success',
    scheduleUpdated: 'Schedule updated.',
    parseErrorTitle: 'Markdown Parsing Error',
    parseErrorDescription: 'Failed to load or update the schedule. Please check the format.',
    timezoneUpdated: 'Timezone updated to',
    pleaseCompleteFields: 'Please complete all fields.',
    newCategory: 'New Category',
    notSpecified: 'Not Specified',
    fileExported: 'File exported.',
    exportError: 'Export Error',
    exportErrorDescription: 'Failed to export file.',

    // Default markdown content
    daySchedule: 'Daily Schedule',
    categories: 'Categories',
    tasks: 'Tasks',
    spiritualDevelopment: 'Spiritual Development',
    mainTasks: 'Main Tasks',
    restFood: 'Rest / Food',
    planning: 'Planning',
    learning: 'Learning',
    sleep: 'Sleep',
    physicalActivity: 'Physical Activity',
    reading: 'Reading',
    
    // Default tasks
    morningRoutine: 'Morning Routine',
    morningPractices: 'Morning Practices',
    breakfastReading: 'Breakfast, Reading',
    workBlock1: 'Work - Block 1',
    lunchRest: 'Lunch and Rest',
    workBlock2: 'Work - Block 2',
    learningTime: 'Learning',
    physicalActivityTime: 'Physical Activity',
    planningTomorrow: 'Planning for Tomorrow',
    dinner: 'Dinner',
    freeTimeReading: 'Free Time / Reading',
    eveningRoutine: 'Evening Routine',
    sleepTime: 'Sleep',
    
    // Day stats
    dayFillness: 'Day Fillness',
    conflicts: 'Conflicts',
    categoryBreakdown: 'By Category',
    hours: 'h',
    minutes: 'm',
    
    // Current task widget
    currentTask: 'Current Task',
    nextTask: 'Next',
    noCurrentTask: 'No active tasks',
    endsIn: 'Ends in',
    startsIn: 'Starts in',
    dayStats: 'Day Statistics',
  },
  ru: {
    // Main page
    taskList: 'Список задач',
    addTask: 'Добавить задачу',
    import: 'Импорт',
    export: 'Экспорт',
    settings: 'Настройки',
    loading: 'Загрузка...',
    
    // Settings dialog
    settingsTitle: 'Настройки',
    settingsDescription: 'Редактируйте расписание, категории и часовой пояс.',
    timezone: 'Часовой пояс',
    selectTimezone: 'Выберите часовой пояс',
    markdownEditor: 'Редактор Markdown',
    saveMarkdown: 'Сохранить Markdown',
    categoryManagement: 'Управление категориями',
    addCategory: 'Добавить категорию',
    saveCategories: 'Сохранить категории',
    removeCategory: 'Удалить категорию',
    categoryName: 'Название категории',
    close: 'Закрыть',
    theme: 'Тема',
    language: 'Язык',
    lightTheme: 'Светлая тема',
    darkTheme: 'Тёмная тема',
    
    // Task dialog
    newTask: 'Новая задача',
    editTask: 'Редактировать задачу',
    fillTaskDetails: 'Заполните детали новой задачи.',
    makeTaskChanges: 'Внесите изменения в задачу.',
    name: 'Название',
    start: 'Начало',
    end: 'Конец',
    category: 'Категория',
    status: 'Статус',
    selectCategory: 'Выберите категорию',
    selectStatus: 'Выберите статус',
    inProgress: '⏳ В процессе',
    completed: '✅ Завершено',
    delete: 'Удалить',
    cancel: 'Отмена',
    save: 'Сохранить',
    
    // Task checklist
    noTasksDisplay: 'Нет задач для отображения.',
    editTaskSr: 'Редактировать задачу',
    deleteTaskSr: 'Удалить задачу',
    
    // Messages and notifications
    success: 'Успешно',
    scheduleUpdated: 'Расписание обновлено.',
    parseErrorTitle: 'Ошибка парсинга Markdown',
    parseErrorDescription: 'Не удалось загрузить или обновить расписание. Проверьте формат.',
    timezoneUpdated: 'Часовой пояс обновлен на',
    pleaseCompleteFields: 'Пожалуйста, заполните все поля.',
    newCategory: 'Новая категория',
    notSpecified: 'Не указано',
    fileExported: 'Файл экспортирован.',
    exportError: 'Ошибка экспорта',
    exportErrorDescription: 'Не удалось экспортировать файл.',

    // Default markdown content
    daySchedule: 'Расписание дня',
    categories: 'Категории',
    tasks: 'Задачи',
    spiritualDevelopment: 'Духовное развитие',
    mainTasks: 'Основные задачи',
    restFood: 'Отдых / Питание',
    planning: 'Планирование',
    learning: 'Обучение',
    sleep: 'Сон',
    physicalActivity: 'Физическая активность',
    reading: 'Чтение',
    
    // Default tasks
    morningRoutine: 'Утренняя рутина',
    morningPractices: 'Утренние практики',
    breakfastReading: 'Завтрак, Чтение',
    workBlock1: 'Работа - Блок 1',
    lunchRest: 'Обед и отдых',
    workBlock2: 'Работа - Блок 2',
    learningTime: 'Обучение',
    physicalActivityTime: 'Физическая активность',
    planningTomorrow: 'Планирование на завтра',
    dinner: 'Ужин',
    freeTimeReading: 'Свободное время / Чтение',
    eveningRoutine: 'Вечерняя рутина',
    sleepTime: 'Сон',
    
    // Day stats
    dayFillness: 'Заполненность дня',
    conflicts: 'Конфликты',
    categoryBreakdown: 'По категориям',
    hours: 'ч',
    minutes: 'м',
    
    // Current task widget
    currentTask: 'Текущая задача',
    nextTask: 'Далее',
    noCurrentTask: 'Нет активных задач',
    endsIn: 'Закончится через',
    startsIn: 'Начнётся через',
    dayStats: 'Статистика дня',
  }
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
  generateDefaultMarkdown: () => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

export function useTranslationHook() {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language') as Language;
      if (stored && (stored === 'en' || stored === 'ru')) {
        setLanguageState(stored);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  // Always return a short English default schedule for first run
  const generateDefaultMarkdown = (): string => {
    return `# Daily Schedule

## Categories
- Spiritual Development (#F6A24C)
- Main Tasks (#3E847C)
- Rest / Food (#D8D4C9)
- Planning (#EB7957)
- Sleep (#3D505E)

## Tasks
### 06:30-07:00 Morning Routine
- Category: Spiritual Development
- Status: ⏳ In Progress

### 09:00-12:00 Work - Block 1
- Category: Main Tasks
- Status: ⏳ In Progress

### 12:30-13:00 Lunch
- Category: Rest / Food
- Status: ⏳ In Progress

### 15:00-17:00 Work - Block 2
- Category: Main Tasks
- Status: ⏳ In Progress

### 21:30-22:00 Evening Planning
- Category: Planning
- Status: ⏳ In Progress

### 22:30-06:30 Sleep
- Category: Sleep
- Status: ✅ Completed
`;
  };

  return {
    language,
    setLanguage,
    t: translations[language],
    generateDefaultMarkdown,
  };
}

export { TranslationContext, translations };
export type { TranslationContextType };