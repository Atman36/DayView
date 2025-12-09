'use client';
import type { FC } from 'react';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, Category } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task | Omit<Task, 'id'>) => void; // Accept both full Task and Task without ID
  task: Task | null; // Null when adding a new task
  categories: Category[];
  onDelete: (taskId: string) => void; // Added delete handler
  isAdding?: boolean; // Flag to indicate if we are adding a new task
  initialValues?: Partial<Task>; // Prefill values when adding
}

export const TaskDialog: FC<TaskDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  categories,
  onDelete,
  isAdding = false, // Default to false (editing mode)
  initialValues,
}) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [status, setStatus] = useState<string>('');
  const [icon, setIcon] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    if (isAdding) {
      // Adding: prefer provided initial values, else fall back to sensible defaults
      setName(initialValues?.name ?? '');
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const defStart = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const defEndDate = new Date(now.getTime() + 60 * 60 * 1000);
      const defEnd = `${pad(defEndDate.getHours())}:${pad(defEndDate.getMinutes())}`;
      setStartTime(initialValues?.startTime ?? defStart);
      setEndTime(initialValues?.endTime ?? defEnd);
      setCategoryName(initialValues?.categoryName ?? categories[0]?.name ?? '');
      setStatus(initialValues?.status ?? t.inProgress);
      setIcon(initialValues?.icon ?? '');
    } else if (task) {
      // Editing existing task
      setName(task.name);
      setStartTime(task.startTime);
      setEndTime(task.endTime);
      setCategoryName(task.categoryName);
      setStatus(task.status);
      setIcon(task.icon ?? '');
    }
  }, [isOpen, task, isAdding, categories, initialValues]);

  // Ссылки на элементы ввода для навигации между ними
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const startTimeInputRef = React.useRef<HTMLInputElement>(null);
  const endTimeInputRef = React.useRef<HTMLInputElement>(null);
  const categorySelectRef = React.useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    // Basic validation
    if (!name || !startTime || !endTime || !categoryName) {
        // Add user feedback (e.g., using toast)
      alert(t.pleaseCompleteFields);
      return;
    }

    if (isAdding) {
        const newTaskData: Omit<Task, 'id'> = { name, startTime, endTime, categoryName, status, icon: icon || undefined };
        onSave(newTaskData);
    } else if (task) {
        const updatedTask: Task = { ...task, name, startTime, endTime, categoryName, status, icon: icon || undefined };
        onSave(updatedTask);
    }
    
    onClose(); // Закрываем диалог после сохранения
  };
  
  // Обработчик ввода для полей времени для автоперехода к минутам
  const handleTimeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    
    // Если введены 2 цифры часа, переходим к минутам
    if (value.length === 2 && !value.includes(':')) {
      input.value = value + ":";
    }
  };
  
  // Обработчик нажатия Enter для перехода к следующему полю
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement | HTMLButtonElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef.current) {
        nextRef.current.focus();
      }
    }
  };
  
  // Обработчик нажатия Enter на последнем поле (сохранение формы)
  const handleEndTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (categorySelectRef.current) {
        categorySelectRef.current.focus();
      } else {
        handleSave(); // Если нет следующего поля, сохраняем форму
      }
    }
  };

   const handleDelete = () => {
    if (task && !isAdding) {
      onDelete(task.id);
      onClose(); // Close dialog after deletion
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isAdding ? t.newTask : t.editTask}</DialogTitle>
          <DialogDescription>
             {isAdding ? t.fillTaskDetails : t.makeTaskChanges}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t.name}
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-12 text-center text-lg"
                placeholder="🎯"
                maxLength={2}
              />
              <Input
                id="name"
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, startTimeInputRef)}
                className="flex-1"
                autoFocus
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right">
              {t.start}
            </Label>
            <Input
              id="start-time"
              ref={startTimeInputRef}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              onInput={handleTimeInput}
              onKeyDown={(e) => handleKeyDown(e, endTimeInputRef)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-time" className="text-right">
              {t.end}
            </Label>
            <Input
              id="end-time"
              ref={endTimeInputRef}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              onInput={handleTimeInput}
              onKeyDown={handleEndTimeKeyDown}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              {t.category}
            </Label>
            <Select value={categoryName} onValueChange={setCategoryName}>
              <SelectTrigger className="col-span-3" ref={categorySelectRef}>
                <SelectValue placeholder={t.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    <div className="flex items-center">
                       <span
                          className="h-3 w-3 rounded-full mr-2 inline-block"
                          style={{ backgroundColor: cat.color }}
                       ></span>
                       {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              {t.status}
            </Label>
             <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={t.inProgress}>{t.inProgress}</SelectItem>
                    <SelectItem value={t.completed}>{t.completed}</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
           {!isAdding && task && (
            <Button type="button" variant="destructive" onClick={handleDelete}>
              {t.delete}
            </Button>
           )}
           <div className="flex gap-2 justify-end flex-grow">
             <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t.cancel}
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleSave}>
                {t.save}
              </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
