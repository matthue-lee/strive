type WorkoutActivity = {
  id: string; // uuid or hash
  type: 'rest' | 'gym' | 'run' | 'surf' | 'custom';
  label?: string; // e.g., "Leg Day", "Easy Run"
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
};

type WorkoutDay = {
  date: string; // ISO date
  activities: WorkoutActivity[];
};
