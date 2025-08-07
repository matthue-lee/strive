import { usePlanStore } from '@/store/usePlanStore'; // adjust path
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function TodaysWorkoutCard({
  activities,
  date,
}: {
  activities: string[];
  date: string;
}) {

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Today’s Workout</Text>

        {activities.map((activity, index) => {
        const isDone = usePlanStore((s) => s.isCompleted(date, activity));
        const toggle = usePlanStore((s) => s.toggleCompleted);

        return (
            <TouchableOpacity
            key={index}
            style={styles.activityRow}
            onPress={() => toggle(date, activity)}
            >
            <View style={[styles.checkboxBox, isDone && styles.checkedBox]}>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.activityLabel, isDone && styles.activityDone]}>
                {activity}
            </Text>
            </TouchableOpacity>
        );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
activityRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 10,
},
activityLabel: {
  fontSize: 16,
  color: '#333',
},
activityDone: {
  textDecorationLine: 'line-through',
  color: '#aaa',
},

});
