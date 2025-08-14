import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

// Single source of truth for date keys
export const formatDateKey = (d: Date) => format(d, 'yyyy-MM-dd');

type State = {
  planByDate: Record<string, string[]>;
  completedByDate: Record<string, string[]>; // arrays of activity strings marked done
};

type Actions = {
  savePlan: (date: Date, activities: string[]) => void;
  updateActivity: (dayKey: string, index: number, newActivity: string) => void;
  removeActivity: (dayKey: string, index: number) => void;

  toggleCompleted: (dayKey: string, activity: string) => void;
  isCompleted: (dayKey: string, activity: string) => boolean;

  // Optional helpers if you want them elsewhere
  getPlannedFor: (dayKey: string) => string[];
  getCompletedFor: (dayKey: string) => string[];
};

export const usePlanStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      planByDate: {},
      completedByDate: {},

      savePlan: (date, activities) => {
        const dayKey = formatDateKey(date);
        set((s) => ({
          planByDate: { ...s.planByDate, [dayKey]: activities },
          // prune completed list to only activities that still exist for that day
          completedByDate: {
            ...s.completedByDate,
            [dayKey]: (s.completedByDate[dayKey] || []).filter((a) =>
              activities.includes(a)
            ),
          },
        }));
      },

      updateActivity: (dayKey, index, newActivity) => {
        set((s) => {
          const current = s.planByDate[dayKey] ?? [];
          if (index < 0 || index >= current.length) return s;

          const oldActivity = current[index];
          const next = [...current];
          next[index] = newActivity;

          const completed = new Set(s.completedByDate[dayKey] || []);
          if (completed.has(oldActivity)) {
            completed.delete(oldActivity);
            completed.add(newActivity);
          }

          return {
            planByDate: { ...s.planByDate, [dayKey]: next },
            completedByDate: {
              ...s.completedByDate,
              [dayKey]: Array.from(completed),
            },
          };
        });
      },

      removeActivity: (dayKey, index) => {
        set((s) => {
          const current = s.planByDate[dayKey] ?? [];
          if (index < 0 || index >= current.length) return s;

          const removed = current[index];
          const next = current.filter((_, i) => i !== index);

          const completed = new Set(s.completedByDate[dayKey] || []);
          completed.delete(removed);

          return {
            planByDate: { ...s.planByDate, [dayKey]: next },
            completedByDate: {
              ...s.completedByDate,
              [dayKey]: Array.from(completed),
            },
          };
        });
      },

      toggleCompleted: (dayKey, activity) => {
        set((s) => {
          const planned = s.planByDate[dayKey] ?? [];
          // guard: only toggle if the activity exists for that day
          if (!planned.includes(activity)) return s;

          const completed = new Set(s.completedByDate[dayKey] || []);
          if (completed.has(activity)) {
            completed.delete(activity);
          } else {
            completed.add(activity);
          }

          return {
            completedByDate: {
              ...s.completedByDate,
              [dayKey]: Array.from(completed),
            },
          };
        });
      },

      isCompleted: (dayKey, activity) => {
        const s = get();
        return !!s.completedByDate[dayKey]?.includes(activity);
      },

      getPlannedFor: (dayKey) => get().planByDate[dayKey] ?? [],
      getCompletedFor: (dayKey) => get().completedByDate[dayKey] ?? [],
    }),
    {
      name: 'plan-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
