import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlanService } from './planService';

const keyFor = (dateKey: string) => `plan:${dateKey}`;

async function read(dateKey: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(keyFor(dateKey));
  return raw ? (JSON.parse(raw) as string[]) : [];
}

async function write(dateKey: string, activities: string[]) {
  await AsyncStorage.setItem(keyFor(dateKey), JSON.stringify(activities));
}

export const localPlanService: PlanService = {
  async getPlan(dateKey) {
    const activities = await read(dateKey);
    return { dateKey, activities };
  },

  async addActivity(dateKey, activity) {
    const activities = await read(dateKey);
    // optional de-dupe:
    if (!activities.includes(activity)) activities.push(activity);
    await write(dateKey, activities);
  },

  async removeActivity(dateKey, index) {
    const activities = await read(dateKey);
    if (index >= 0 && index < activities.length) {
      activities.splice(index, 1);
      await write(dateKey, activities);
    }
  },

  // Optional: speeds up your month grid
  async getPlansByMonth(year, month) {
    // month is 1..12 expected by your UI; pad to 2 digits
    const m = String(month).padStart(2, '0');
    const prefix = `${year}-${m}-`;
    const out: Record<string, string[]> = {};

    // naive scan – fine for local storage; replace with API call later
    const keys = await AsyncStorage.getAllKeys();
    const dayKeys = keys.filter(k => k.startsWith('plan:') && k.includes(prefix));
    const entries = await AsyncStorage.multiGet(dayKeys);
    for (const [k, v] of entries) {
      const dateKey = k.replace('plan:', '');
      out[dateKey] = v ? (JSON.parse(v) as string[]) : [];
    }
    return out;
  },
};
