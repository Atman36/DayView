'use client';
import type { FC } from 'react';
import React, { useState } from 'react';
import type { Task, Category } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
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
    const newStatus = task.status === t.completed ? t.inProgress : t.completed;
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
    <div className="space-y-3">

      {tasks.length === 0 ? (
         <p className="text-muted-foreground text-center py-4">{t.noTasksDisplay}</p>
       ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
               <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(task.categoryName) }}
                  title={task.categoryName}
                ></span>
              <Checkbox
                id={`task-${task.id}`}
                checked={task.status === t.completed}
                onCheckedChange={() => handleToggleStatus(task)}
                className="flex-shrink-0"
              />
              <div
                className={`flex-1 min-w-0 text-sm cursor-pointer truncate ${
                  task.status === t.completed ? 'line-through text-muted-foreground' : ''
                }`}
                onClick={() => handleEditClick(task)}
              >
                 <span className="font-mono text-xs mr-2">{task.startTime}-{task.endTime}</span>
                 {task.name}
              </div>
            </div>
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleEditClick(task)}
              >
                <Edit className="h-4 w-4" />
                 <span className="sr-only">{t.editTaskSr}</span>
              </Button>
               <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClick(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t.deleteTaskSr}</span>
               </Button>
            </div>
          </div>
        ))
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
