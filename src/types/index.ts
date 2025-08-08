export interface Task {
  id: string;
  name: string;
  startTime: string; // Format HH:MM
  endTime: string;   // Format HH:MM
  categoryName: string;
  status: string; // Dynamic status based on language (e.g., '⏳ In Progress', '✅ Completed')
}

export interface Category {
  name: string;
  color: string; // Hex color code, e.g., #F6A24C
}
