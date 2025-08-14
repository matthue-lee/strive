// hooks/plan.ts
import * as api from '@/services/supabasePlanService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, startOfWeek } from 'date-fns';

// ---------- config ----------
const WEEK_STARTS_ON: 0 | 1 = 1; // 0=Sunday, 1=Monday — set to match your app

// ---------- helpers ----------
const weekStartKeyFromDateKey = (dateKey: string) => {
  const d = parseISO(dateKey);
  const ws = startOfWeek(d, { weekStartsOn: WEEK_STARTS_ON });
  return format(ws, 'yyyy-MM-dd');
};

const categoryFromLabel = (label: string) =>
  (label.split(':')[0] || '').trim().toUpperCase();

type WeeklyMap = Record<string, { scheduled: number; completed: number }>;

// Put near the top of hooks/plan.ts
type MonthData = {
  planByDate: Record<string, string[]>;
  completedByDate: Record<string, string[]>;
  rangeStart?: string; // optional, only for clarity
  rangeEnd?: string;
};

// returns YYYY-MM-DD string compare
const withinRange = (startKey: string, endKey: string, dateKey: string) =>
  startKey <= dateKey && dateKey <= endKey;

// Optimistically update any cached month windows that include dateKey
function updateMonthCaches(
  qc: ReturnType<typeof useQueryClient>,
  dateKey: string,
  updater: (prev: MonthData) => MonthData
) {
  const entries = qc.getQueriesData<MonthData>({ queryKey: ['month-data'] });
  for (const [qKey, prev] of entries) {
    if (!Array.isArray(qKey)) continue;
    // Expect keys like ['month-data', startKey, endKey]
    const [, startKey, endKey] = qKey as [string, string, string];
    if (!startKey || !endKey || !prev) continue;
    if (!withinRange(startKey, endKey, dateKey)) continue;

    qc.setQueryData<MonthData>(qKey, updater(prev));
  }
}
// ---------- read queries ----------
export function usePlan(dateKey: string) {
  return useQuery({
    queryKey: ['plan', dateKey],
    queryFn: () => api.getPlan(dateKey),
    enabled: !!dateKey,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompleted(dateKey: string) {
  return useQuery({
    queryKey: ['completed', dateKey],
    queryFn: () => api.getCompleted(dateKey),
    enabled: !!dateKey,
    staleTime: 0, // keep this "live" so toggles are instant after invalidation
  });
}

// ---------- mutations ----------
export function useAddActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ dateKey, activity }: { dateKey: string; activity: string }) =>
      api.addActivity(dateKey, activity),

    onMutate: async ({ dateKey, activity }) => {
      await qc.cancelQueries({ queryKey: ['plan', dateKey] });
      const prevPlan = qc.getQueryData<api.Plan>(['plan', dateKey]);

      // per-day optimistic
      qc.setQueryData<api.Plan>(['plan', dateKey], {
        ...(prevPlan ?? { dateKey, activities: [] }),
        activities: [...(prevPlan?.activities ?? []), activity],
      });

      // month-window optimistic
      updateMonthCaches(qc, dateKey, (prev) => {
        const planByDate = { ...prev.planByDate };
        const before = planByDate[dateKey] ?? [];
        // avoid dupes
        const nextDay = before.includes(activity) ? before : [...before, activity];
        planByDate[dateKey] = nextDay;
        return { ...prev, planByDate };
      });

      // 2) Optimistically bump weekly scheduled
      const weekKey = weekStartKeyFromDateKey(dateKey);
      const prevWeek = qc.getQueryData<WeeklyMap>(['weekly-breakdown', weekKey]) ?? {};
      const cat = categoryFromLabel(activity);
      const cur = prevWeek[cat] ?? { scheduled: 0, completed: 0 };

      const nextWeek: WeeklyMap = {
        ...prevWeek,
        [cat]: { ...cur, scheduled: cur.scheduled + 1 },
      };
      qc.setQueryData<WeeklyMap>(['weekly-breakdown', weekKey], nextWeek);

      return { prevPlan, prevWeek, weekKey, dateKey };
    },

    onError: (_e, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(['plan', ctx.dateKey], ctx.prevPlan);
      qc.setQueryData(['weekly-breakdown', ctx.weekKey], ctx.prevWeek);
    },

    onSettled: (_d, _e, { dateKey }) => {
      qc.invalidateQueries({ queryKey: ['plan', dateKey] });
      const weekKey = weekStartKeyFromDateKey(dateKey);
      qc.invalidateQueries({ queryKey: ['weekly-breakdown', weekKey] });
      qc.invalidateQueries({ queryKey: ['month-data'] });
    },
  });
}

export function useRemoveActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ dateKey, activity }: { dateKey: string; activity: string }) =>
      api.removeActivity(dateKey, activity),

    onMutate: async ({ dateKey, activity }) => {
      await qc.cancelQueries({ queryKey: ['plan', dateKey] });
      const prevPlan = qc.getQueryData<api.Plan>(['plan', dateKey]);
      const nextActivities = (prevPlan?.activities ?? []).filter((a) => a !== activity);

      // per-day optimistic
      qc.setQueryData<api.Plan>(['plan', dateKey], {
        ...(prevPlan ?? { dateKey, activities: [] }),
        activities: nextActivities,
      });

      // month-window optimistic
      updateMonthCaches(qc, dateKey, (prev) => {
        const planByDate = { ...prev.planByDate };
        const before = planByDate[dateKey] ?? [];
        const nextDay = before.filter((a) => a !== activity);
        planByDate[dateKey] = nextDay;
        return { ...prev, planByDate };
      });

      // 2) Optimistically decrement weekly scheduled
      const weekKey = weekStartKeyFromDateKey(dateKey);
      const prevWeek = qc.getQueryData<WeeklyMap>(['weekly-breakdown', weekKey]) ?? {};
      const cat = categoryFromLabel(activity);
      const cur = prevWeek[cat] ?? { scheduled: 0, completed: 0 };

      const nextWeek: WeeklyMap = {
        ...prevWeek,
        [cat]: { ...cur, scheduled: Math.max(0, cur.scheduled - 1) },
      };
      qc.setQueryData<WeeklyMap>(['weekly-breakdown', weekKey], nextWeek);

      return { prevPlan, prevWeek, weekKey, dateKey };
    },

    onError: (_e, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(['plan', ctx.dateKey], ctx.prevPlan);
      qc.setQueryData(['weekly-breakdown', ctx.weekKey], ctx.prevWeek);
    },

    onSettled: (_d, _e, { dateKey }) => {
      qc.invalidateQueries({ queryKey: ['plan', dateKey] });
      const weekKey = weekStartKeyFromDateKey(dateKey);
      qc.invalidateQueries({ queryKey: ['weekly-breakdown', weekKey] });
      qc.invalidateQueries({ queryKey: ['month-data'] });
    },
  });
}

export function useToggleCompleted() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ dateKey, activity }: { dateKey: string; activity: string }) =>
      api.toggleCompleted(dateKey, activity),

    onMutate: async ({ dateKey, activity }) => {
      // 1) Optimistically flip per-day completed list
      await qc.cancelQueries({ queryKey: ['completed', dateKey] });

      const prevCompleted = qc.getQueryData<string[]>(['completed', dateKey]) ?? [];
      const wasDone = prevCompleted.includes(activity);
      const nextCompleted = wasDone
        ? prevCompleted.filter((a) => a !== activity)
        : [...prevCompleted, activity];

      updateMonthCaches(qc, dateKey, (prev) => {
        const completedByDate = { ...prev.completedByDate };
        completedByDate[dateKey] = nextCompleted; // from your existing logic
        return { ...prev, completedByDate };
      });
      
      qc.setQueryData<string[]>(['completed', dateKey], nextCompleted);

      // 2) Optimistically bump weekly completed
      const weekKey = weekStartKeyFromDateKey(dateKey);
      const prevWeek = qc.getQueryData<WeeklyMap>(['weekly-breakdown', weekKey]) ?? {};
      const cat = categoryFromLabel(activity);
      const cur = prevWeek[cat] ?? { scheduled: 0, completed: 0 };
      const nextCompletedCount = Math.max(0, cur.completed + (wasDone ? -1 : 1));

      const nextWeek: WeeklyMap = {
        ...prevWeek,
        [cat]: { ...cur, completed: nextCompletedCount },
      };
      qc.setQueryData<WeeklyMap>(['weekly-breakdown', weekKey], nextWeek);

      return { prevCompleted, prevWeek, weekKey, dateKey };
    },

    onError: (_e, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(['completed', ctx.dateKey], ctx.prevCompleted);
      qc.setQueryData(['weekly-breakdown', ctx.weekKey], ctx.prevWeek);
    },

    onSettled: (_d, _e, { dateKey }) => {
      qc.invalidateQueries({ queryKey: ['completed', dateKey] });
      const weekKey = weekStartKeyFromDateKey(dateKey);
      qc.invalidateQueries({ queryKey: ['weekly-breakdown', weekKey] });
      
    },
  });
}