// hooks/weekly.ts
import { formatDateKey } from '@/library/date';
import { getWeeklyActivityBreakdown } from '@/library/getWeeklyBreakdown'; // make sure path matches
import { useQuery } from '@tanstack/react-query';

export function useWeeklyBreakdown(weekStart: Date) {
  const key = formatDateKey(weekStart); // stable per week (YYYY-MM-DD)
  return useQuery({
    queryKey: ['weekly-breakdown', key],
    queryFn: () => getWeeklyActivityBreakdown(weekStart),
    enabled: !!weekStart,
    staleTime: 0,            // <= ensure refetch after invalidation
  });
}