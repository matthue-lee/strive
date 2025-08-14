export type Plan = { dateKey: string; activities: string[] };

export interface PlanService {
  getPlan(dateKey: string): Promise<Plan>;
  addActivity(dateKey: string, activity: string): Promise<void>;
  removeActivity(dateKey: string, index: number): Promise<void>; // 👈 new
  // (optional, nice for the calendar)
  getPlansByMonth?(year: number, month: number): Promise<Record<string, string[]>>;
}
