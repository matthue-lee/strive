// app/(tabs)/index.tsx
import TodaysWorkoutCard from '@/components/TodaysWorkoutCard';
import { WeekBreakdownCard } from '@/components/WeekBreakdownCard';
import { WeekOverviewCard } from '@/components/weekOverviewCard';
import { usePlan } from '@/hooks/plan';
import { useWeeklyBreakdown } from '@/hooks/weekly';
import getWeekDateStrings from '@/library/getWeekDateStrings';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getIconForLabel(label: string) {
  switch (label) {
    case 'RUN':
      return <MaterialCommunityIcons name="run" size={18} color="black" />;
    case 'GYM':
      return <FontAwesome5 name="dumbbell" size={16} color="black" />;
    case 'YOGA':
      return <MaterialCommunityIcons name="yoga" size={18} color="black" />;
    case 'SURF':
      return <MaterialCommunityIcons name="wave" size={18} color="black" />;
    case 'REST':
      return <MaterialCommunityIcons name="sleep" size={18} color="black" />;
    default:
      return <MaterialCommunityIcons name="help" size={18} color="black" />;
  }
}

export default function HomeScreen() {
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');

  // Week start for the breakdown
  const weekDates = getWeekDateStrings(today);    // returns Date[]
  const weekStart = weekDates[0];

  // Queries
  const { data: todayPlan } = usePlan(todayKey);  // { dateKey, activities: string[] }
  const { data: breakdown = {}, isLoading, error } = useWeeklyBreakdown(weekStart);

  // Totals for WeekOverviewCard
  const totals = useMemo(() => {
    return Object.values(breakdown).reduce(
      (acc, v) => {
        acc.scheduled += v.scheduled;
        acc.completed += v.completed;
        return acc;
      },
      { scheduled: 0, completed: 0 }
    );
  }, [breakdown]);

  // Build the props WeekBreakdownCard expects
  const activitiesForCard = useMemo(
    () =>
      Object.entries(breakdown)
        .map(([label, v]) => ({
          label,             // e.g., 'RUN'
          icon: getIconForLabel(label),
          count: v.completed,
          target: v.scheduled,
        }))
        // optional: hide rows with no plan for the week
        .filter(item => item.target > 0),
    [breakdown]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Strive</Text>
      </View>

      <WeekOverviewCard
        completedActivities={totals.completed}
        totalPlannedActivities={totals.scheduled}
        totalDistance={0}
        onPress={() => console.log('Week details pressed')}
      />

      {todayPlan?.activities?.length ? (
        <TodaysWorkoutCard date={todayKey} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {isLoading ? 'Loading…' : error ? 'Could not load today’s plan.' : 'No workout planned for today.'}
          </Text>
        </View>
      )}

      {/* Pass startDate and activities array built above */}
      <WeekBreakdownCard startDate={weekStart} activities={activitiesForCard} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#001f3f' },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#001f3f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  empty: { margin: 16, backgroundColor: '#1e1e1e', borderRadius: 12, padding: 16 },
  emptyText: { color: '#ccc', fontSize: 16 },
});