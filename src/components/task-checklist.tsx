'use client';
import type { FC } from 'react';
import React, { useState } from 'react';
import type { Task, Category } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { isTaskCompleted } from '@/utils/task-status';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { TaskDialog } from './task-dialog'; // Re-use TaskDialog for editing

interface TaskChecklistProps {
  tasks: Task[];
  categories: Category[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (newTask: Omit<Task, 'id'>) => void; // Add this prop
}

export const TaskChecklist: FC<TaskChecklistProps> = ({
  tasks,
  categories,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
}) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
   const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
   const [isAddingTask, setIsAddingTask] = useState(false);
   const { t } = useTranslation();


  const handleToggleStatus = (task: Task) => {
    const newStatus = isTaskCompleted(task.status) ? t.inProgress : t.completed;
    onUpdateTask({ ...task, status: newStatus });
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsAddingTask(false); // Ensure we are in edit mode
    setIsTaskDialogOpen(true);
  };

   const handleAddClick = () => {
    setEditingTask(null); // Clear any editing task
    setIsAddingTask(true); // Set to add mode
    setIsTaskDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
    setIsAddingTask(false);
  };

   const handleDialogSave = (taskData: Task | Omit<Task, 'id'>) => {
    if ('id' in taskData) {
      // Editing existing task
      onUpdateTask(taskData);
    } else {
       // Adding new task
       // Find default category or first category
      const defaultCategory = categories.find(cat => cat.name === taskData.categoryName) || categories[0];
       onAddTask({
         ...taskData,
         categoryName: defaultCategory?.name || t.notSpecified,
         status: taskData.status || t.inProgress,
       });
    }
    handleDialogClose();
  };

    const handleDeleteClick = (taskId: string) => {
     // Optional: Add confirmation dialog here
     onDeleteTask(taskId);
   };


   const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.color : '#cccccc'; // Default grey
  };


  return (
    <div className="flex flex-col">

      {tasks.length === 0 ? (
         <p className="text-muted-foreground text-center py-4">{t.noTasksDisplay}</p>
       ) : (
        tasks.map((task) => {
          const done = isTaskCompleted(task.status);
          return (
          <div
            key={task.id}
            className="group flex items-center gap-2.5 py-2 border-t border-border first:border-t-0"
            style={{ opacity: done ? 0.55 : 1 }}
          >
            <Checkbox
              id={`task-${task.id}`}
              checked={done}
              onCheckedChange={() => handleToggleStatus(task)}
              className="flex-shrink-0"
            />
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getCategoryColor(task.categoryName) }}
              title={task.categoryName}
            />
            <span
              className={`flex-1 min-w-0 text-[13.5px] font-medium cursor-pointer truncate ${
                done ? 'line-through' : ''
              }`}
              onClick={() => handleEditClick(task)}
            >
              {task.icon} {task.name}
            </span>
            <span className="font-mono text-[12px] text-muted-foreground flex-shrink-0">
              {task.startTime}–{task.endTime}
            </span>
            <span className="font-mono text-[10.5px] text-muted-foreground flex-shrink-0 hidden sm:inline">
              {task.status}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={() => handleDeleteClick(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">{t.deleteTaskSr}</span>
            </Button>
          </div>
          );
        })
       )}

        {isTaskDialogOpen && (
          <TaskDialog
            isOpen={isTaskDialogOpen}
            onClose={handleDialogClose}
            onSave={handleDialogSave}
            task={editingTask} // Pass null if adding
            categories={categories}
            onDelete={handleDeleteClick}
            isAdding={isAddingTask} // Pass the mode flag
          />
        )}
    </div>
  );
};
