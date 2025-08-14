// services/weeklyBreakdown.ts
import { formatDateKey } from '@/library/date';
import { supabase } from '@/library/supabase';

export type WeeklyBreakdown = Record<string, { scheduled: number; completed: number }>;

function asOne<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

/**
 * Fetches a week's worth of data (weekStart .. weekStart+6) and aggregates by activity category.
 * Returns keys like "RUN", "GYM" etc.
 */
export async function getWeeklyActivityBreakdown(weekStart: Date): Promise<WeeklyBreakdown> {
  // Build date range (YYYY-MM-DD)
  const start = formatDateKey(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  const end = formatDateKey(endDate);

  // Current user (RLS needs this)
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const breakdown: WeeklyBreakdown = {};

  // Planned: join to activities to get category (sport)
  const { data: planned, error: pErr } = await supabase
    .from('activity_planned')
    .select('planned_date, activities:activities!inner(user_id, sport)')
    .gte('planned_date', start)
    .lte('planned_date', end)
    .eq('activities.user_id', userId);
  if (pErr) throw pErr;

  for (const row of planned ?? []) {
    const act = asOne<any>(row.activities);
    if (!act) continue;
    const key = String(act.sport ?? '').trim().toUpperCase();
    if (!breakdown[key]) breakdown[key] = { scheduled: 0, completed: 0 };
    breakdown[key].scheduled += 1;
  }

  // Completed: join to activities to get category (sport)
  const { data: done, error: cErr } = await supabase
    .from('activity_completed')
    .select('local_date, activities:activities!inner(user_id, sport)')
    .gte('local_date', start)
    .lte('local_date', end)
    .eq('activities.user_id', userId);
  if (cErr) throw cErr;

  for (const row of done ?? []) {
    const act = asOne<any>(row.activities);
    if (!act) continue;
    const key = String(act.sport ?? '').trim().toUpperCase();
    if (!breakdown[key]) breakdown[key] = { scheduled: 0, completed: 0 };
    breakdown[key].completed += 1;
  }

  return breakdown;
}
