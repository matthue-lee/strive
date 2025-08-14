// components/TodaysWorkoutCard.tsx
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useCompleted, usePlan, useToggleCompleted } from '@/hooks/plan';

const PALETTE = ['#f94144','#f3722c','#f8961e','#f9844a','#f9c74f','#90be6d','#43aa8b','#4d908e','#577590','#277da1'];
const CATEGORY_COLORS: Record<string, string> = {
  run:'#277da1', gym:'#f3722c', surf:'#43aa8b', yoga:'#f9c74f', rest:'#577590',
  swim:'#90be6d', bike:'#43aa8b', boxing:'#f94144', hike:'#f8961e', stretch:'#f9844a', climb:'#4d908e',
};
function getColorForCategory(raw?: string | null) {
  const key = (raw || '').trim().toLowerCase();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}
function getIconForType(type: string, color: string) {
  switch ((type || '').toLowerCase()) {
    case 'run': return <MaterialCommunityIcons name="run" size={18} color={color} />;
    case 'gym': return <FontAwesome5 name="dumbbell" size={16} color={color} />;
    case 'yoga': return <MaterialCommunityIcons name="yoga" size={18} color={color} />;
    case 'surf': return <MaterialCommunityIcons name="wave" size={18} color={color} />;
    case 'rest': return <MaterialCommunityIcons name="sleep" size={18} color={color} />;
    case 'swim': return <MaterialCommunityIcons name="swim" size={18} color={color} />;
    case 'bike': return <MaterialCommunityIcons name="bike" size={18} color={color} />;
    case 'boxing': return <MaterialCommunityIcons name="boxing-glove" size={18} color={color} />;
    case 'hike': return <MaterialCommunityIcons name="hiking" size={18} color={color} />;
    case 'stretch': return <MaterialCommunityIcons name="arm-flex" size={18} color={color} />;
    case 'climb': return <MaterialCommunityIcons name="image-filter-hdr" size={18} color={color} />;
    default: return <MaterialCommunityIcons name="calendar" size={16} color={color} />;
  }
}

type Props = { date: Date | string; activities?: string[] };

export default function TodaysWorkoutCard({ date, activities: fallback = [] }: Props) {
  const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');

  const { data: planData, isLoading: planLoading, isError: planError } = usePlan(dateKey);
  const planned = planData?.activities ?? fallback;

  const { data: completedData, isLoading: compLoading } = useCompleted(dateKey);
  const completedSet = new Set(completedData ?? []);

  const toggleCompleted = useToggleCompleted();

  // Single place to handle haptics around the mutation
  const handleToggle = async (activity: string, wasDone: boolean) => {
    // 1) immediate, lightweight feedback on tap
    // selectionAsync is subtle and reliable on iOS
    Haptics.selectionAsync().catch(() => {});

    // 2) kick off mutation
    toggleCompleted.mutate(
      { dateKey, activity },
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Today’s Workout</Text>

      {planError ? (
        <Text style={styles.helper}>Couldn’t load today’s plan.</Text>
      ) : planLoading && planned.length === 0 ? (
        <Text style={styles.helper}>Loading…</Text>
      ) : planned.length === 0 ? (
        <Text style={styles.helper}>No activities planned.</Text>
      ) : (
        planned.map((activity, idx) => {
          const [type, label] = activity.split(':').map((v) => v.trim());
          const color = getColorForCategory(type);
          const isDone = completedSet.has(activity);

          return (
            <TouchableOpacity
              key={`${activity}-${idx}`}
              style={styles.activityRow}
              onPress={() => handleToggle(activity, isDone)}
              activeOpacity={0.85}
              disabled={compLoading || toggleCompleted.isPending}
            >
              <View
                style={[
                  styles.checkboxBox,
                  { borderColor: color },
                  isDone && { backgroundColor: color, borderColor: color },
                ]}
              >
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </View>

              {getIconForType(type, color)}

              <Text
                style={[
                  styles.activityLabel,
                  isDone ? styles.activityDone : { color },
                ]}
                numberOfLines={1}
              >
                {label || activity}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
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
  header: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  helper: { color: '#777', marginTop: 6 },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  checkboxBox: {
    width: 22, height: 22, borderWidth: 2, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 16, lineHeight: 16 },
  activityLabel: { fontSize: 16, color: '#333', flexShrink: 1 },
  activityDone: { textDecorationLine: 'line-through', color: '#aaa' },
});