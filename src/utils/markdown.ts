import type { Task, Category } from '@/types';

/**
 * Parses Markdown content to extract tasks and categories.
 * @param markdown - The Markdown string content.
 * @returns An object containing arrays of tasks and categories.
 */
export const parseMarkdown = (markdown: string): { tasks: Task[]; categories: Category[] } => {
  const lines = markdown.trim().split('\n');
  const tasks: Task[] = [];
  const categories: Category[] = [];
  let currentSection: 'categories' | 'tasks' | null = null;
  let currentTask: Partial<Task> | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Detect section headers in RU or EN
    if (trimmedLine.startsWith('## Категории') || trimmedLine.startsWith('## Categories')) {
      currentSection = 'categories';
      continue;
    } else if (trimmedLine.startsWith('## Задачи') || trimmedLine.startsWith('## Tasks')) {
      currentSection = 'tasks';
       if (currentTask) { // Save the last task before switching section
         tasks.push(finalizeTask(currentTask));
         currentTask = null;
       }
      continue;
    }

    if (currentSection === 'categories') {
      // Example line: "- Духовное развитие (#F6A24C)"
      // Support both "Name (#HEX)" and "Name (#hex)" with optional space before parentheses
      const categoryMatch = trimmedLine.match(/^\-\s*([^#]+)\(\s*#([0-9A-Fa-f]{6})\s*\)$/);
      if (categoryMatch) {
        categories.push({
          name: categoryMatch[1].trim(),
          color: `#${categoryMatch[2]}`,
        });
      }
    } else if (currentSection === 'tasks') {
      // Example line: "### 06:00-06:30 Утренняя рутина"
       const taskHeaderMatch = trimmedLine.match(/^###\s*(\d{2}:\d{2})-(\d{2}:\d{2})\s*(.+)$/);
       if (taskHeaderMatch) {
         // If a new task starts, save the previous one
         if (currentTask) {
           tasks.push(finalizeTask(currentTask));
         }
         currentTask = {
           id: Date.now().toString() + Math.random().toString(16).slice(2), // Simple unique ID
           startTime: taskHeaderMatch[1],
           endTime: taskHeaderMatch[2],
           name: taskHeaderMatch[3].trim(),
           // Language-agnostic default (emoji first, English text)
           status: '⏳ In Progress',
         };
       } else if (currentTask && (trimmedLine.startsWith('- Категория:') || trimmedLine.startsWith('- Category:'))) {
         const label = trimmedLine.startsWith('- Категория:') ? '- Категория:' : '- Category:';
         currentTask.categoryName = trimmedLine.substring(label.length).trim();
       } else if (currentTask && (trimmedLine.startsWith('- Статус:') || trimmedLine.startsWith('- Status:'))) {
         const label = trimmedLine.startsWith('- Статус:') ? '- Статус:' : '- Status:';
         const status = trimmedLine.substring(label.length).trim() as Task['status'];
         // Accept both RU/EN or any string the user provides
         currentTask.status = status;
       }
    }
  }

   // Add the last task being processed
   if (currentTask) {
     tasks.push(finalizeTask(currentTask));
   }


  return { tasks, categories };
};

// Helper to ensure task has all required fields before pushing
const finalizeTask = (task: Partial<Task>): Task => {
    if (!task.name || !task.startTime || !task.endTime || !task.categoryName) {
        console.warn("Incomplete task data found during parsing:", task);
        // Provide default values for missing fields to avoid runtime errors
      task.name = task.name || 'Unnamed Task';
        task.startTime = task.startTime || '00:00';
        task.endTime = task.endTime || '00:00';
      task.categoryName = task.categoryName || 'Uncategorized';
      task.status = task.status || '⏳ In Progress';
        task.id = task.id || Date.now().toString() + Math.random().toString(16).slice(2);
    }
    return task as Task;
};


/**
 * Generates Markdown content from tasks and categories arrays.
 * @param tasks - Array of Task objects.
 * @param categories - Array of Category objects.
 * @returns A Markdown string representing the schedule.
 */
export const generateMarkdown = (tasks: Task[], categories: Category[]): string => {
  // Generate in English for a language-agnostic, predictable output
  let markdown = `# Daily Schedule\n\n`;

  markdown += `## Categories\n`;
  categories.forEach(cat => {
    markdown += `- ${cat.name} (${cat.color})\n`;
  });
  markdown += `\n`;

  markdown += `## Tasks\n`;
  // Sort tasks by start time before generating markdown
   const sortedTasks = [...tasks].sort((a, b) => {
    const timeA = parseInt(a.startTime.replace(':', ''), 10);
    const timeB = parseInt(b.startTime.replace(':', ''), 10);
    return timeA - timeB;
  });

  sortedTasks.forEach(task => {
    markdown += `### ${task.startTime}-${task.endTime} ${task.name}\n`;
    markdown += `- Category: ${task.categoryName}\n`;
    markdown += `- Status: ${task.status}\n\n`; // Add extra newline for spacing
  });

  return markdown.trim(); // Remove trailing newline
};
