import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PlanStore = {
  planByDate: Record<string, string[]>;
  completedByDate: Record<string, string[]>;
  savePlan: (date: string, activities: string[]) => void;
  toggleCompleted: (date: string, activity: string) => void;
  isCompleted: (date: string, activity: string) => boolean;
};

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      planByDate: {},
      completedByDate: {},

      savePlan: (date, activities) =>
        set((state) => ({
          planByDate: {
            ...state.planByDate,
            [date]: activities,
          },
        })),

      toggleCompleted: (date, activity) => {
        const current = get().completedByDate[date] || [];
        const alreadyDone = current.includes(activity);

        const updated = alreadyDone
          ? current.filter((a) => a !== activity)
          : [...current, activity];

        set((state) => ({
          completedByDate: {
            ...state.completedByDate,
            [date]: updated,
          },
        }));
      },

      isCompleted: (date, activity) => {
        const completed = get().completedByDate[date] || [];
        return completed.includes(activity);
      },
    }),
    {
      name: 'strive-plans',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
