// services/supabasePlanService.ts
import { supabase } from '@/library/supabase';

export type Plan = { dateKey: string; activities: string[] };

const titleCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const labelOf = (sport: string, subtype?: string | null) =>
  subtype ? `${titleCase(sport)}: ${subtype}` : titleCase(sport);

function asOne<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

export async function getPlan(dateKey: string): Promise<Plan> {
  const { data, error } = await supabase
    .from('activity_planned')
    .select(
      'activity_id, planned_date, local_date_key, activities:activities!inner(id, sport, subtype)'
    )
    .eq('local_date_key', dateKey)
    .throwOnError();
  if (error) throw error;

  const activities =
    (data ?? []).map((row: any) => {
      const act = asOne(row.activities);
      return act ? labelOf(act.sport, act.subtype) : '';
    }).filter(Boolean);

  return { dateKey, activities };
}

export async function addActivity(dateKey: string, label: string): Promise<void> {
  const [sportRaw, subtypeRaw] = label.split(':').map((s) => s.trim());
  const sport = (sportRaw || 'other').toLowerCase();
  const subtype = subtypeRaw || null;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: act, error: e1 } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      sport,
      subtype,
      source: 'manual',
    })
    .select()
    .single()
    .throwOnError();
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('activity_planned')
    .insert({
      activity_id: act.id,
      planned_date: dateKey,
    })
    .throwOnError();
  if (e2) throw e2;
}

export async function removeActivity(dateKey: string, label: string): Promise<void> {
  const [sportRaw, subtypeRaw] = label.split(':').map((s) => s.trim());
  const sport = (sportRaw || '').toLowerCase();
  const subtype = subtypeRaw || null;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('activity_planned')
    .select(`
      activity_id,
      local_date_key,
      planned_date,
      activities:activities!inner (
        id,
        user_id,
        sport,
        subtype,
        created_at
      )
    `)
    .eq('local_date_key', dateKey)
    .eq('activities.user_id', userId)
    .order('created_at', { referencedTable: 'activities', ascending: false });
  if (error) throw error;

  const match = (data ?? []).find((r: any) => {
    const act = asOne(r.activities);
    return act
      && act.sport === sport
      && ((subtype === null && (act.subtype == null || act.subtype === '')) || act.subtype === subtype);
  });
  if (!match) return;

  const { error: e1 } = await supabase
    .from('activity_planned')
    .delete()
    .eq('activity_id', match.activity_id);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('activities')
    .delete()
    .eq('id', match.activity_id)
    .eq('user_id', userId);
  if (e2) throw e2;
}

// ---------- Completed helpers ----------



const utcFromDateKey = (dateKey: string) =>
  new Date(`${dateKey}T12:00:00.000Z`);

export async function getCompleted(dateKey: string): Promise<string[]> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return [];

  const { data } = await supabase
    .from('activity_completed')
    .select('activity_id, local_date_key, activities:activities!inner(user_id, sport, subtype)')
    .eq('local_date_key', dateKey)
    .eq('activities.user_id', userId)
    .throwOnError();

  return (data ?? [])
    .map((r: any) => {
      const act = asOne(r.activities);
      return act ? labelOf(act.sport, act.subtype) : '';
    })
    .filter(Boolean);
}

export async function toggleCompleted(dateKey: string, label: string): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [sportRaw, subtypeRaw] = label.split(':').map(s => s.trim());
  const sport = (sportRaw ?? '').toLowerCase();
  const subtype = subtypeRaw ?? null;

  // Find the planned activity for that *day* + label
  const { data: planned } = await supabase
    .from('activity_planned')
    .select('activity_id, local_date_key, activities:activities!inner(id, user_id, sport, subtype, created_at)')
    .eq('local_date_key', dateKey)
    .eq('activities.user_id', userId)
    .order('created_at', { foreignTable: 'activities', ascending: false }) // supabase-js v2
    .throwOnError();

  const match = (planned ?? []).find((r: any) => {
    const act = asOne(r.activities);
    return act
      && act.sport === sport
      && ((subtype === null && (act.subtype == null || act.subtype === '')) || act.subtype === subtype);
  });

  if (!match) {
    // No matching planned activity for that day/label.
    return;
  }

  const activityId = match.activity_id;

  // Already completed?
  const { data: existing } = await supabase
    .from('activity_completed')
    .select('activity_id')
    .eq('activity_id', activityId)
    .maybeSingle()
    .throwOnError();

  if (existing) {
    // Un-complete (delete by PK)
    await supabase
      .from('activity_completed')
      .delete()
      .eq('activity_id', activityId)
      .throwOnError();
    return;
  }

  // Complete it
  const ts = utcFromDateKey(dateKey).toISOString();
  await supabase
    .from('activity_completed')
    .insert({
      activity_id: activityId,
      start_time_utc: ts,
      tz: 'UTC',
      local_date: dateKey,
      local_date_key: dateKey,
    })
    .throwOnError();
}
