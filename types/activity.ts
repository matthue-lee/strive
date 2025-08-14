// types/activity.ts

export type UUID = string;
export type Source = 'manual' | 'strava' | 'apple_health';

// Normalize all units internally to SI (m, s, W, bpm); convert at the edges.

export type ActivityStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'canceled';

export type SportId =
  | 'run'
  | 'bike'
  | 'swim'
  | 'gym'
  | 'yoga'
  | 'surf'
  | 'hike'
  | 'climb'
  | 'rest'
  | 'other';

export interface Activity {
  id: UUID;
  userId: UUID;

  // taxonomy & presentation
  sport: SportId;                  // e.g. 'run'
  subtype?: string;                // e.g. 'Tempo Run', 'Push', 'Vinyasa'
  color?: string;                  // use your palette if you want to pin a color
  tags?: string[];                 // 'race', 'trail', 'injury-prevent', etc.

  status: ActivityStatus;

  // Link planned vs actual
  planned?: PlannedWorkout;        // what you intended to do
  actual?: ActualWorkout;          // what you actually did (from Strava/Health or manual log)
  plannedActivityId?: UUID;        // if this record represents an actual workout linked to a separate planned record

  // Integrations mapping (useful for idempotent upserts)
  sourceIds?: {
    strava?: string;               // Strava activity ID
    appleHealth?: string;          // HK workout UUID
    // add others as needed
  };
  dataOrigins?: DataOrigin[];      // provenance history for merges

  notes?: string;
  privacy?: 'private' | 'followers' | 'public';

  createdAt: string;               // ISO-8601 UTC
  updatedAt: string;               // ISO-8601 UTC
  deleted?: boolean;               // soft-delete tombstone
}

export interface DataOrigin {
  source: Source;
  importedAt: string;              // ISO
  lastSeenAt?: string;             // for change detection
  versionHash?: string;            // optional checksum to detect updates
}

/** What you scheduled */
export interface PlannedWorkout {
  // anchor to a local-day (important for calendars)
  localDateKey: string;            // 'YYYY-MM-DD' in user’s local tz at creation time
  startLocal?: string;             // ISO local time if you scheduled a time
  timezone?: string;               // e.g. 'Pacific/Auckland'

  expected?: SummaryMetrics;       // target duration/distance, etc.
  structure?: WorkoutBlock[];      // interval plan (see below)
  targets?: Targets;               // high-level targets (HR, pace, power)
  locationHint?: LocationHint;     // gym home, pool, generic route, etc.
}

/** What actually happened */
export interface ActualWorkout {
  source: Source;                  // 'strava' | 'apple_health' | 'manual'
  startedAt: string;               // ISO UTC
  endedAt?: string;                // ISO UTC
  startLocal?: string;             // ISO local (helpful for UI and day bucketing)
  timezone?: string;               // Olson TZ id

  metrics: SummaryMetrics;         // totals/averages
  laps?: Lap[];                    // intervals/laps/sets
  streams?: StreamsRef;            // time-series (can be remote to keep payloads small)
  route?: RouteRef;                // polyline or server reference
  gear?: GearRef;                  // shoes, bike
  devices?: DeviceInfo[];          // watch/headunit
  weather?: WeatherSnapshot;       // optional
  perceived?: PerceivedExertion;   // RPE/feel
}

export interface SummaryMetrics {
  duration_s?: number;
  moving_s?: number;
  distance_m?: number;
  elevation_gain_m?: number;
  calories_kcal?: number;

  // Cardiovascular
  avg_hr_bpm?: number;
  max_hr_bpm?: number;

  // Run
  avg_pace_s_per_km?: number;
  best_1k_s?: number;

  // Bike
  avg_power_w?: number;
  max_power_w?: number;
  np_w?: number;                   // normalized power
  tss?: number;                    // if available

  // Swim
  swolf?: number;

  // Strength
  sets?: number;
  reps?: number;
  volume_kg?: number;              // sum(weight*reps)
}

export type BlockType =
  | 'warmup'
  | 'steady'
  | 'interval'
  | 'recovery'
  | 'cooldown'
  | 'rest';

export interface WorkoutBlock {
  type: BlockType;
  label?: string;                  // 'Tempo', '400m', 'Z2', etc.
  // One of: time, distance, or a repeat structure
  duration?: {
    seconds?: number;
    distance_m?: number;
  };
  repeat?: {
    count: number;
    on: WorkoutBlock[];            // nested blocks inside a repeat
  };
  target?: Targets;                // per-block target
}

export interface Targets {
  hr_bpm?: Range;                  // e.g. 150..165
  pace_s_per_km?: Range;
  power_w?: Range;
  cadence_spm?: Range;
  rpe?: Range;                     // 1..10
}

export interface Range {
  min?: number;
  max?: number;
}

export interface Lap {
  index: number;                   // 1-based
  start_s?: number;                // seconds from workout start
  end_s?: number;
  label?: string;
  metrics?: SummaryMetrics;        // per-lap stats
}

export interface StreamsRef {
  storage: 'inline' | 'remote';
  // If remote, store a pointer to your backend path; keep Strava/HealthKit specifics on the server.
  url?: string;
  inline?: Partial<{
    t_s: number[];                 // elapsed time(s)
    lat: number[];                 // degrees
    lng: number[];
    alt_m: number[];
    hr_bpm: number[];
    power_w: number[];
    cadence_spm: number[];
    speed_mps: number[];
  }>;
}

export interface RouteRef {
  polyline?: string;               // Google/Mapbox encoded polyline
  bounds?: { minLat: number; minLng: number; maxLat: number; maxLng: number };
  // or a server id if you store routes separately
  id?: UUID;
}

export interface GearRef {
  shoesId?: UUID;
  bikeId?: UUID;
  description?: string;            // 'Nike Pegasus 39', 'Canyon Ultimate'
}

export interface DeviceInfo {
  manufacturer?: string;
  model?: string;                  // 'Apple Watch Series 8', 'Garmin Forerunner 955'
  firmware?: string;
  sourceApp?: string;              // 'Strava iOS', 'Health'
}

export interface LocationHint {
  kind: 'indoor' | 'outdoor' | 'pool' | 'open_water' | 'gym';
  name?: string;
}

export interface WeatherSnapshot {
  temp_c?: number;
  humidity?: number;
  wind_mps?: number;
  description?: string;
}

export interface PerceivedExertion {
  rpe?: number;                    // 1..10
  mood?: 'great' | 'good' | 'ok' | 'bad';
  soreness?: number;               // 0..10
}
