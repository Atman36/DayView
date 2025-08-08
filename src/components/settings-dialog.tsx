
'use client';
import type { FC } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import type { Category } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import type { Language } from '@/hooks/use-translation';
import { X, Plus, Save, Globe, Sun, Moon, Languages } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
  onMarkdownChange: (newMarkdown: string) => void;
  categories: Category[];
  onCategoriesChange: (newCategories: Category[]) => void;
  timezone: string;
  onTimezoneChange: (newTimezone: string) => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

// List of common timezones (can be expanded)
const timezones = [
    "UTC",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Yekaterinburg", // Default
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Pacific/Honolulu",
];


export const SettingsDialog: FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  markdownContent,
  onMarkdownChange,
  categories: initialCategories,
  onCategoriesChange,
  timezone: initialTimezone,
  onTimezoneChange,
  theme,
  onThemeChange,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [localMarkdown, setLocalMarkdown] = useState(markdownContent);
  const [localCategories, setLocalCategories] = useState<Category[]>(initialCategories);
   const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdownContent);
   const [selectedTimezone, setSelectedTimezone] = useState<string>(initialTimezone);

   // Update local state when props change
   useEffect(() => {
    setLocalMarkdown(markdownContent);
    setLocalCategories(initialCategories);
    setSelectedTimezone(initialTimezone); // Sync timezone
  }, [markdownContent, initialCategories, initialTimezone, isOpen]); // Re-sync when dialog opens

  // Debounce Markdown updates to avoid excessive parsing on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMarkdown(localMarkdown);
    }, 500); // Adjust debounce delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [localMarkdown]);


   const handleMarkdownSave = () => {
    onMarkdownChange(debouncedMarkdown); // Use debounced value for saving
    // Keep dialog open? onClose();
  };

  const handleCategoryNameChange = (index: number, newName: string) => {
    const updatedCategories = [...localCategories];
    updatedCategories[index] = { ...updatedCategories[index], name: newName };
    setLocalCategories(updatedCategories);
  };

  const handleCategoryColorChange = (index: number, newColor: string) => {
    const updatedCategories = [...localCategories];
    updatedCategories[index] = { ...updatedCategories[index], color: newColor };
    setLocalCategories(updatedCategories);
  };

  const handleAddCategory = () => {
    const newCategory: Category = { name: `${t.newCategory} ${localCategories.length + 1}`, color: '#cccccc' };
    setLocalCategories([...localCategories, newCategory]);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  const handleThemeToggle = () => {
    if (onThemeChange) {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      onThemeChange(newTheme);
    }
  };

  const handleRemoveCategory = (index: number) => {
    const updatedCategories = localCategories.filter((_, i) => i !== index);
    setLocalCategories(updatedCategories);
  };

  const handleCategoriesSave = () => {
    onCategoriesChange(localCategories);
    // Optionally close the dialog or provide feedback
    // onClose(); // Maybe keep open to edit markdown next?
  };

  const handleTimezoneSelect = (newTimezone: string) => {
    setSelectedTimezone(newTimezone);
    onTimezoneChange(newTimezone); // Update immediately
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.settingsTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6 py-4">
             {/* Timezone, Theme, and Language Row */}
            <div>
                <Label htmlFor="timezone-select" className="text-lg font-semibold mb-2 block flex items-center gap-1">
                    <Globe className="h-5 w-5" /> {t.timezone}
                </Label>
                 <div className="grid grid-cols-6 gap-2 items-center">
                  <Select value={selectedTimezone} onValueChange={handleTimezoneSelect} >
                      <SelectTrigger id="timezone-select" className="w-full min-w-0 col-span-4">
                          <SelectValue placeholder={t.selectTimezone} />
                      </SelectTrigger>
                      <SelectContent>
                          {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                              {tz.replace(/_/g, ' ')}
                          </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  
                  {/* Language Selector */}
                  <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="w-full justify-center">
                          <span className="text-sm font-medium">{language.toUpperCase()}</span>
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="en">EN</SelectItem>
                          <SelectItem value="ru">RU</SelectItem>
                      </SelectContent>
                  </Select>
                  
                  {/* Theme Toggle Icon */}
                  <Select value={theme || 'system'} onValueChange={(value) => {
                    if (value === 'system') {
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      onThemeChange?.(prefersDark ? 'dark' : 'light');
                    } else {
                      onThemeChange?.(value as 'light' | 'dark');
                    }
                  }}>
                      <SelectTrigger className="w-full justify-center">
                          {theme === 'dark' ? <Moon className="h-4 w-4" /> : 
                           theme === 'light' ? <Sun className="h-4 w-4" /> :
                           <div className="h-4 w-4 rounded-full bg-gradient-to-r from-orange-400 to-blue-600" />}
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" /> Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" /> Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-orange-400 to-blue-600" /> System
                            </div>
                          </SelectItem>
                      </SelectContent>
                  </Select>
                </div>
            </div>

           {/* Markdown Editor Section */}
            <div>
                <Label htmlFor="markdown-editor" className="text-lg font-semibold mb-2 block">{t.markdownEditor}</Label>
                <Textarea
                    id="markdown-editor"
                    value={localMarkdown}
                    onChange={(e) => setLocalMarkdown(e.target.value)}
                    rows={10}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder={`Enter schedule in Markdown format...`}
                />
                <Button onClick={handleMarkdownSave} size="sm" className="mt-2">
                    <Save className="mr-2 h-4 w-4" /> {t.saveMarkdown}
                </Button>
            </div>

           {/* Category Management Section */}
           <div>
                <Label className="text-lg font-semibold mb-3 block">{t.categoryManagement}</Label>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {localCategories.map((category, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                    <Input
                        type="color"
                        value={category.color}
                        onChange={(e) => handleCategoryColorChange(index, e.target.value)}
                        className="w-10 h-10 p-1 flex-shrink-0"
                    />
                    <Input
                        type="text"
                        value={category.name}
                        onChange={(e) => handleCategoryNameChange(index, e.target.value)}
                        className="flex-grow"
                        placeholder={t.categoryName}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCategory(index)}
                        className="text-destructive hover:text-destructive h-8 w-8"
                        title={t.removeCategory}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t.delete}</span>
                    </Button>
                    </div>
                ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={handleAddCategory}>
                      <Plus className="mr-2 h-4 w-4" /> {t.addCategory}
                  </Button>
                  <Button onClick={handleCategoriesSave} size="sm">
                      <Save className="mr-2 h-4 w-4" /> {t.saveCategories}
                  </Button>
                </div>
           </div>
        </div>


        {/* Removed DialogFooter with close button */}
      </DialogContent>
    </Dialog>
  );
};
