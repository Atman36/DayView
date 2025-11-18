import { useCallback, type ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';

export function useFileOperations() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Импорт файла
  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>, onDataUpdate: (content: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          onDataUpdate(content);
        }
      };
      reader.readAsText(file);
      // Сбрасываем input для возможности повторного импорта того же файла
      event.target.value = '';
    }
  }, []);

  // Экспорт файла
  const handleExport = useCallback((content: string, filename: string = 'schedule.md') => {
    try {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t.success,
        description: t.fileExported,
      });
    } catch (error) {
      console.error('Error exporting file:', error);
      toast({
        title: t.exportError,
        description: t.exportErrorDescription,
        variant: 'destructive',
      });
    }
  }, [toast, t]);

  return {
    handleImport,
    handleExport,
  };
}