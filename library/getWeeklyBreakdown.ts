export default function getWeeklyActivityBreakdown(planByDate: Record<string, string[]>, weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const counts: Record<string, number> = {};

  for (const [dateString, activities] of Object.entries(planByDate)) {
    const date = new Date(dateString);
    if (date >= weekStart && date <= weekEnd) {
      for (const activity of activities) {
        const [category] = activity.split(':');
        const key = category.trim().toUpperCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }

  return counts;
}
