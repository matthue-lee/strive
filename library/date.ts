// utils/date.ts
import { format } from 'date-fns';

export function formatDateKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}
