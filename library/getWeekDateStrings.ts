import { format, startOfWeek, addDays } from 'date-fns';

export default function getWeekDateStrings(baseDate: Date): Date[] {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
