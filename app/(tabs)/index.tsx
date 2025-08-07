import { TodaysWorkoutCard } from '@/components/TodaysWorkoutCard';
import { WeekBreakdownCard } from '@/components/WeekBreakdownCard';
import { WeekOverviewCard } from '@/components/weekOverviewCard';
import getWeeklyActivityBreakdown from '@/library/getWeeklyBreakdown';
import { usePlanStore } from '@/store/usePlanStore';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
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
      return <MaterialCommunityIcons name="yoga" size={18} color="black" />;
    case 'REST':
      return <MaterialCommunityIcons name="yoga" size={18} color="black" />;
    default:
      return <MaterialCommunityIcons name="help" size={18} color="black" />;
  }
}


export default function HomeScreen() {
  const today = new Date();
  const todayKey = today.toDateString();
  const { planByDate } = usePlanStore();
  const todayActivities = planByDate[todayKey] || [];

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const counts = getWeeklyActivityBreakdown(planByDate, startOfWeek);
  const activityList = Object.entries(counts).map(([label, count]) => ({
    label,
    count,
    target: count, // you can set dynamic targets later
    icon: getIconForLabel(label),
  }));


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Strive</Text>
      </View>

      <WeekOverviewCard
        weekNumber={2}
        completedDays={0}
        totalDistance={0}
        onPress={() => console.log('Week details pressed')}
      />

      {todayActivities.length > 0 ? (
        <TodaysWorkoutCard activities={todayActivities} date={todayKey} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No workout planned for today.</Text>
        </View>
      )}

    <WeekBreakdownCard
      startDate={new Date()}
      activities={activityList}
    />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#001f3f',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#001f3f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    margin: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
  },
});
