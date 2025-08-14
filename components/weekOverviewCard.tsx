import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function WeekOverviewCard({
  completedActivities,
  totalPlannedActivities,
  totalDistance,
  targetDistance = 34.1,
  onPress,
}: {
  completedActivities: number;
  totalPlannedActivities: number;
  totalDistance: number;
  targetDistance?: number;
  onPress?: () => void;
}){
const activityIndicators = Array.from({ length: totalPlannedActivities }, (_, i) => (
  <View
    key={i}
    style={[
      styles.dayDash,
      i < completedActivities ? styles.dayCompleted : styles.dayPending,
    ]}
  />
));


  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>Week Overview</Text>
      </View>

    <View style={styles.dashContainer}>{activityIndicators}</View>
      <View style={styles.footer}>
        <Text style={styles.metric}>Workouts: <Text style={styles.bold}>{completedActivities}/{totalPlannedActivities}</Text></Text>
        {/* <Text style={styles.metric}>Distance: <Text style={styles.bold}>{totalDistance.toFixed(1)}/{targetDistance}KM</Text></Text> */}
      </View>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  dashContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayDash: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: '#e0e0e0',
  },
  dayCompleted: {
    backgroundColor: '#4CAF50',
  },
  dayPending: {
    backgroundColor: '#e0e0e0',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    fontSize: 14,
    color: '#444',
  },
  bold: {
    fontWeight: '700',
    color: '#000',
  },
});
