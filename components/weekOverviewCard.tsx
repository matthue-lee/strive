import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function WeekOverviewCard({
  weekNumber,
  completedDays,
  totalDistance,
  targetDistance = 34.1,
  onPress,
}: {
  weekNumber: number;
  completedDays: number;
  totalDistance: number;
  targetDistance?: number;
  onPress?: () => void;
}) {
  const dayIndicators = Array.from({ length: 7 }, (_, i) => (
    <View
      key={i}
      style={[
        styles.dayDash,
        i < completedDays ? styles.dayCompleted : styles.dayPending,
      ]}
    />
  ));

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>Week {weekNumber} Overview</Text>
        <Feather name="chevron-right" size={20} color="#444" />
      </View>

      <View style={styles.dashContainer}>{dayIndicators}</View>

      <View style={styles.footer}>
        <Text style={styles.metric}>Workouts: <Text style={styles.bold}>{completedDays}/7</Text></Text>
        <Text style={styles.metric}>Distance: <Text style={styles.bold}>{totalDistance.toFixed(1)}/{targetDistance}KM</Text></Text>
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
