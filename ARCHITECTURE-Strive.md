# Strive – Architecture & Data Reference

This document captures the current design of the **planning / completion** features we built together: database schema and RLS policies, Supabase service layer, React Query hooks, and the UI components (including the fast Calendar Heatmap + Day Popover). Save this in your repo (e.g., `docs/ARCHITECTURE.md`).

---

## 1) High-level flow

```
┌────────────┐      ┌──────────────────────┐       ┌───────────────────┐
│  UI layer  │◄───► │ React Query hooks   │ ◄───►  │ Supabase services │
│ (cards &   │      │ (plan.ts, weekly.ts)│       │ (supabasePlan...) │
│  calendar) │      └──────────────────────┘       └───────────────────┘
└────────────┘                    │                             │
                                  ▼                             ▼
                            ┌─────────────────────────────────────────┐
                            │        Postgres (Supabase)              │
                            │ activities, activity_planned,           │
                            │ activity_completed + RLS policies       │
                            └─────────────────────────────────────────┘
```

- **UI** renders **planned** items and **completed** items per day/week.
- **Toggling completion** writes to `activity_completed` and updates caches optimistically for instant feedback.
- **Weekly overview/breakdown** aggregates scheduled vs completed across 7 days.
- **Calendar heatmap** is optimized: premeasures grid and cells, shows an anchored popover instantly, with haptic + tiny scale dip.

---

## 2) Database schema (Supabase / Postgres)

> The schema below matches how the code reads/writes. If your DB already exists, treat this as a reference and adjust names/types to match your migrations.

### 2.1 `activities`

Represents a *logical* activity (category and optional subtype) added by a user; a planned or completed row references one of these.

```sql
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport text not null,            -- e.g., 'run', 'gym', 'yoga' (lowercase)
  subtype text,                   -- e.g., 'Tempo', 'Upper Body', nullable
  source text default 'manual',   -- 'manual' etc.
  created_at timestamptz not null default now()
);

-- Helpful index for lookups by user + created_at
create index if not exists idx_activities_user_created_at on public.activities (user_id, created_at desc);
```

### 2.2 `activity_planned`

A plan entry that places an activity on a specific date.

```sql
create table if not exists public.activity_planned (
  activity_id uuid not null references public.activities(id) on delete cascade,
  planned_date date not null,          -- authoritative date
  local_date_key text,                 -- 'YYYY-MM-DD' string; optional convenience
  created_at timestamptz not null default now()
);

-- Useful for range queries in weekly/month views
create index if not exists idx_planned_date on public.activity_planned (planned_date);
create index if not exists idx_planned_date_key on public.activity_planned (local_date_key);
```

> The code prefers `local_date_key` if present; otherwise falls back to `planned_date`. If you don't want `local_date_key`, keep it null and our code still works since we use `planned_date` as a fallback.

### 2.3 `activity_completed`

Represents a *completion* record for a specific date / time for a given activity.

```sql
create table if not exists public.activity_completed (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  start_time_utc timestamptz not null,     -- when the activity happened in UTC
  tz text default 'UTC',                   -- origin tz string
  local_date date not null,                -- day label in user's tz
  local_date_key text,                     -- 'YYYY-MM-DD' string; optional convenience
  created_at timestamptz not null default now()
);

create index if not exists idx_completed_local_date on public.activity_completed (local_date);
create index if not exists idx_completed_local_date_key on public.activity_completed (local_date_key);
create index if not exists idx_completed_activity on public.activity_completed (activity_id);
```

> The toggle code writes `start_time_utc` as noon of the `dateKey` (`YYYY-MM-DDT12:00:00Z`) to keep it simple, plus `local_date` and `local_date_key` for filtering.

---

## 3) Row-Level Security (RLS) policies

Enable RLS on all three tables, then use "ownership via activities.user_id" for planned/completed.

```sql
alter table public.activities enable row level security;
alter table public.activity_planned enable row level security;
alter table public.activity_completed enable row level security;

-- activities: full CRUD for owners
create policy "activities_select_own" on public.activities
for select using (auth.uid() = user_id);

create policy "activities_modify_own" on public.activities
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- activity_planned: gate via joined activities.user_id
create policy "planned_select_own" on public.activity_planned
for select using (
  exists (
    select 1 from public.activities a
    where a.id = activity_planned.activity_id and a.user_id = auth.uid()
  )
);

create policy "planned_modify_own" on public.activity_planned
for all using (
  exists (
    select 1 from public.activities a
    where a.id = activity_planned.activity_id and a.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.activities a
    where a.id = activity_planned.activity_id and a.user_id = auth.uid()
  )
);

-- activity_completed: gate via joined activities.user_id
create policy "completed_select_own" on public.activity_completed
for select using (
  exists (
    select 1 from public.activities a
    where a.id = activity_completed.activity_id and a.user_id = auth.uid()
  )
);

create policy "completed_modify_own" on public.activity_completed
for all using (
  exists (
    select 1 from public.activities a
    where a.id = activity_completed.activity_id and a.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.activities a
    where a.id = activity_completed.activity_id and a.user_id = auth.uid()
  )
);
```

> If you already have policies, ensure they provide at least this effective behavior.

---

## 4) Supabase service layer

### 4.1 `services/supabasePlanService.ts`

Key functions (TS signatures):

```ts
export type Plan = { dateKey: string; activities: string[] };

export async function getPlan(dateKey: string): Promise<Plan>;
export async function addActivity(dateKey: string, label: string): Promise<void>;
export async function removeActivity(dateKey: string, label: string): Promise<void>;

export async function getCompleted(dateKey: string): Promise<string[]>;
export async function toggleCompleted(dateKey: string, label: string): Promise<void>;
```

Behavior highlights:

- **Labels** look like `"Run: Tempo"`; category is derived from the left side (sport).
- **addActivity**: creates an `activities` row (owned by the user) then inserts into `activity_planned`.
- **removeActivity**: finds matching planned activity by `sport/subtype` and day; removes both planned row and the `activities` row (since it’s a one-off “manual” for that plan).
- **getCompleted**: joins `activity_completed → activities` and returns array of labels for the day.
- **toggleCompleted**: finds the planned activity for the day and flips an `activity_completed` row (insert or delete). Writes `start_time_utc` with a simple `utcFromDateKey()`.

### 4.2 `services/weeklyBreakdown.ts`

Aggregates a **week** (week start .. +6 days) into a dictionary by **sport** (uppercased), e.g.

```ts
type WeeklyBreakdown = Record<string, { scheduled: number; completed: number }>;
```

It runs **two queries**:
- `activity_planned` in range (join to `activities` → `sport`)
- `activity_completed` in range (join to `activities` → `sport`)

---

## 5) React Query hooks

### 5.1 `hooks/plan.ts`

- `usePlan(dateKey)` → `{dateKey, activities}`
- `useCompleted(dateKey)` → `string[]`
- `useAddActivity`, `useRemoveActivity` with optimistic cache updates for `['plan', dateKey]` and invalidation for weekly.
- `useToggleCompleted` does **optimistic** updates for:
  - `['completed', dateKey]` (add/remove the label)
  - `['weekly-breakdown', weekStartKey]` (increment/decrement `completed` count)
  - followed by server reconciliation via `invalidateQueries`.

> Week key is derived from date with `startOfWeek` (configurable).

### 5.2 `hooks/weekly.ts`

- `useWeeklyBreakdown(weekStart: Date)` → returns the `WeeklyBreakdown` map.
- `queryKey: ['weekly-breakdown', formatDateKey(weekStart)]`

### 5.3 Calendar month data

- `useMonthRangeData(rangeStart, rangeEnd)` fetches:
  - `planByDate: Record<YYYY-MM-DD, string[]>`
  - `completedByDate: Record<YYYY-MM-DD, string[]>`

Used by the Calendar Heatmap for month rendering.

---

## 6) UI components

### 6.1 Palette

```ts
export const PALETTE = [
  '#f94144','#f3722c','#f8961e','#f9844a','#f9c74f',
  '#90be6d','#43aa8b','#4d908e','#577590','#277da1',
];

export const CATEGORY_COLORS: Record<string, string> = {
  run:'#277da1', gym:'#f3722c', surf:'#43aa8b', yoga:'#f9c74f', rest:'#577590',
  swim:'#4d908e', bike:'#90be6d', boxing:'#f94144', hike:'#f8961e', stretch:'#f9844a', climb:'#4d908e',
};
```

### 6.2 `TodaysWorkoutCard`

- Reads planned and completed for **today** via hooks.
- Toggles completion with `useToggleCompleted` (optimistic).
- Uses palette/category colors for icon + checkbox styling.

### 6.3 `WeekOverviewCard`

- Props: `completedActivities`, `totalPlannedActivities` (plus optional distance).
- No direct Supabase ties; we pass totals from `useWeeklyBreakdown` on the parent screen.

### 6.4 `WeekBreakdownCard`

- Expects `activities: { label, count, target, icon }[]`.
- We map our `WeeklyBreakdown` into this shape at call-site.

### 6.5 `CalendarHeatmap` + `DayPopover` (performance-focused)

Key ideas implemented:

- **No measuring on press**. We cache layout of:
  - The **container** view in **window coords** (`measureInWindow` on layout).
  - The **grid** in **window coords** (`measureInWindow` on layout), then convert to **container** coords.
  - Each **cell’s rect** in **grid-local** coords during `onLayout`.
- On press we just do math: `anchor = gridAbs + cellRect` and show the popover **immediately**.
- Tiny **haptic** + **scale dip** (Animated.spring) on the cell.
- Selection halo is a quick absolute `<View>` (no animation timing) for instant feedback.
- Popover is positioned using the computed `anchor` with simple clamping.

> This removed the slow path where Fabric would delay/ignore `measureLayout`/`measure` calls at press time.

---

## 7) Directory map (suggested)

```
/app
  /(tabs)/index.tsx              # Home screen wiring cards to hooks
/components
  TodaysWorkoutCard.tsx
  WeekOverviewCard.tsx
  WeekBreakdownCard.tsx
  CalendarHeatmap.tsx
  DayPopover.tsx
/hooks
  plan.ts
  weekly.ts
/library
  date.ts                        # formatDateKey, etc.
  getWeekDateStrings.ts          # week helpers
  supabase.ts                    # Supabase client
/services
  supabasePlanService.ts
  weeklyBreakdown.ts
/store
  usePlanStore.ts                # (legacy) now replaced by Supabase-backed hooks
```

---

## 8) Query keys & invalidation

- Per-day plan: `['plan', dateKey]`
- Per-day completed: `['completed', dateKey]`
- Weekly: `['weekly-breakdown', weekStartKey]`
- Month window: `['month-data', startKey, endKey]`

Mutations:
- Add/remove activity ⇒ invalidate `['plan', dateKey]` and `['weekly-breakdown', *]` (week-start key prefix).
- Toggle completed ⇒ optimistic update of `['completed', dateKey]` and matching `['weekly-breakdown', weekStartKey]`, then invalidate both to reconcile.

---

## 9) Edge cases & notes

- **Label matching**: we match activities by `(sport, subtype)` where `sport` is stored **lowercase**. Subtype can be null/empty. The label builder uses title-cased sport for display: `"Run: Tempo"`.
- **Null vs empty subtype**: toggle/remove consider `(null | '')` as “no subtype” the same way.
- **Timezones**: we currently set `start_time_utc` to noon UTC of the `dateKey` for simplicity and store `local_date` / `local_date_key` explicitly.
- **Indices**: ensure `planned_date` and `local_date`/`local_date_key` are indexed for week/month range queries.

---

## 10) Example usages (snippets)

### Toggling completion from UI

```ts
const toggle = useToggleCompleted();
toggle.mutate({ dateKey: '2025-02-03', activity: 'Run: Tempo' });
```

### Mapping weekly breakdown to WeekBreakdownCard

```ts
const { data: breakdown = {} } = useWeeklyBreakdown(weekStart);
const activities = Object.entries(breakdown).map(([label, v]) => ({
  label,
  count: v.completed,
  target: v.scheduled,
  icon: getIconForLabel(label),
}));
```

### Calendar month data hook

```ts
const { data } = useMonthRangeData(rangeStart, rangeEnd);
const planByDate = data?.planByDate ?? {};
const completedByDate = data?.completedByDate ?? {};
```

---

## 11) Changelog snapshot of what we added

- Moved from local `usePlanStore` to **Supabase-backed** services + hooks.
- Implemented **optimistic updates** for completion + weekly counts.
- Built **weekly aggregation** via server queries (planned + completed).
- Upgraded **Calendar Heatmap** with:
  - Instant anchored popover (premeasured grid/cells)
  - Haptic + press dip
  - Selection outline
- Centralized **palette** and **category colors** and applied to components.

---

## 12) Next ideas

- Track **distance/duration** per activity (extend schema and cards).
- Add **realtime** (Supabase channels) to reflect changes across devices.
- Expose **subtype presets** per sport for quick entry.
- Add **bulk plan** tools (e.g., template weeks).

---

> If you diverge in your DB schema, update `services/supabasePlanService.ts` and the two aggregation queries accordingly.


Build & Release Playbook (iOS-first)

This section should live at the end of docs/ARCHITECTURE.md.

⸻

Toolchain & Preconditions
	•	macOS: latest stable Xcode (no beta) — set with sudo xcode-select -s /Applications/Xcode.app.
	•	CPU/Terminal: run Terminal in arm64 (not Rosetta). Check with uname -m (should be arm64).
	•	Node: v20 LTS via nvm.
	•	CocoaPods: installed via Homebrew (preferred): brew install cocoapods.
	•	Expo CLI: npm i -g eas-cli (for cloud builds) and project-local expo.

Environment variables (.env.local):

EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...


⸻

Local Dev Build (Simulator & Device)

1) Clean everything

# Xcode caches
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# JS caches
watchman watch-del-all 2>/dev/null || true
rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml
npm i

# Recreate native project
npx expo prebuild --clean

cd ios
pod deintegrate && rm -rf Pods Podfile.lock
pod install
cd ..

2) Run on a simulator

npx expo run:ios --simulator "iPhone 16 Pro"

3) Run on a physical device (recommended)

sudo xcode-select -s /Applications/Xcode.app
npx expo run:ios --device   # pick your iPhone in the prompt

If you have multiple Xcode versions (betas), always point to the stable app.

⸻

TestFlight (friends & family)

This is the only sane way to share a “download link” on iOS without a full App Store launch.

	1.	Ensure unique bundle id in app.json:

{
  "expo": {
    "ios": { "bundleIdentifier": "com.yourname.strive" },
    "version": "0.1.0",
    "ios": { "buildNumber": "1" }
  }
}

	2.	Login & configure EAS:

npm i -g eas-cli
eas login

	3.	Build for iOS (Production for TestFlight):

eas build --platform ios

	4.	Submit to Apple:

eas submit --platform ios

	5.	In App Store Connect → TestFlight:
	•	Add Internal testers (instant).
	•	Enable External testing and share the public invite link after the first beta review.

After the binary is on TestFlight, ship JS-only updates with:

eas update --branch production --message "Fix week heatmap popover"


⸻

Troubleshooting (iOS)

A) ReactCodegen / “[CP-User] Generate Specs” failures

Symptoms: build fails in Pods → ReactCodegen.

Quick checks:
	1.	Terminal arch is arm64 (uname -m).
	2.	Node v20 in PATH for Xcode scripts. If Xcode can’t find Node, export PATH in ~/.zshrc:

export PATH="/opt/homebrew/bin:$PATH"
export PATH="$HOME/.nvm/versions/node/$(node -v)/bin:$PATH"

	3.	Clean steps (above), then reopen Xcode (xed ios) and build once inside Xcode to read the full script log.

If still failing, add a minimal post_install to normalize build settings:

# ios/Podfile
post_install do |installer|
  installer.pods_project.targets.each do |t|
    t.build_configurations.each do |config|
      # Ensure Node/Hermes codegen sees a consistent setting
      config.build_settings['DEFINES_MODULE'] = 'YES'
    end
  end
end

Then cd ios && pod install.

If you previously added use_frameworks!, prefer removing it or use: use_frameworks! :linkage => :static.

B) “Can’t merge pod_target_xcconfig … DEFINES_MODULE” warnings
	•	These are often benign. If the build succeeds, you can ignore them.
	•	If they cause build failures, use the post_install snippet above to force a consistent value, then reinstall Pods.

C) Hermes script phase notice
	•	hermes-engine has added 1 script phase is informational. Safe to proceed.

D) Multiple matching destinations (sim archs)
	•	Explicitly pick a simulator: --simulator "iPhone 16 Pro".
	•	Ensure Terminal is not running under Rosetta (avoid x86_64).

⸻

Versioning & Metadata
	•	Increment expo.version and ios.buildNumber each TestFlight build.
	•	Fill App Privacy in App Store Connect (collects account id + planned/completed activities).
	•	Provide minimal Terms/Privacy links.

⸻

Release Checklists

Preflight
	•	.env.local present and excluded from VCS
	•	RLS policies verified for user isolation
	•	App icon & display name set

Build
	•	npx expo prebuild --clean
	•	pod install
	•	eas build --platform ios

Distribute
	•	eas submit --platform ios
	•	Add testers / share public link

⸻

Notes for Future Android Support
	•	Mirror this process with npx expo run:android and eas build --platform android.
	•	Keep codegen/Gradle caches clean between Node upgrades.