// components/InfiniteDayScroll.tsx
import { format } from 'date-fns';
import React, { memo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAddActivity, useCompleted, usePlan, useRemoveActivity, useToggleCompleted } from '@/hooks/plan';
import { formatDateKey } from '@/library/date';
import PillModal from './PillModal';
import { PlanModal } from './PlanModal';

// ----- Palette -----
const PALETTE = [
  '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f',
  '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1',
];

const CATEGORY_COLORS: Record<string, string> = {
  run: '#277da1',
  gym: '#f3722c',
  surf: '#43aa8b',
  yoga: '#f9c74f',
  rest: '#577590',
  swim: '#4d908e',
  bike: '#90be6d',
  boxing: '#f94144',
  hike: '#f8961e',
  stretch: '#f9844a',
  climb: '#4d908e',
};

const START_INDEX = 10000;
const screenHeight = Dimensions.get('window').height;
const DAY_HEIGHT = screenHeight / 7;

function getDateFromOffset(offset: number) {
  const today = new Date();
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d;
}

function getColorForCategory(raw: string) {
  const key = (raw || '').trim().toLowerCase();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % PALETTE.length;
  return PALETTE[idx];
}

type ActionState = {
  color: string;
  title: string;
  dayKey: string;
  activity: string;
  completed: boolean;
} | null;

const DayRow = memo(function DayRow({
  day,
  onOpenAdd,
}: {
  day: Date;
  onOpenAdd: (date: Date) => void;
}) {
  const dayKey = formatDateKey(day);
  const { data } = usePlan(dayKey);                 // planned labels
  const { data: completedList } = useCompleted(dayKey); // completed labels
  const removeActivity = useRemoveActivity();
  const toggleCompleted = useToggleCompleted();

  const completedSet = new Set(completedList ?? []);
  const [actions, setActions] = useState<ActionState>(null);

  const dayName = format(day, 'EEEE');
  const formattedDate = format(day, 'dd/MM/yyyy');
  const isWeekend = [0, 6].includes(day.getDay());
  const cardStyle = [styles.dayCard, isWeekend && styles.weekendCard];

  const openPillActions = (activity: string, color: string) => {
    const [, label] = activity.split(':').map((s) => s.trim());
    setActions({
      color,
      title: label || activity,
      dayKey,
      activity,
      completed: completedSet.has(activity),
    });
  };

  const plan = data?.activities ?? [];

  return (
    <Pressable
      style={cardStyle}
      onPress={() => onOpenAdd(day)}
      android_ripple={{ color: '#e0e0e0' }}
      hitSlop={6}
    >
      <View style={styles.cardTitleRow}>
        <Text style={styles.dayText}>{dayName}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>

      <View style={styles.body}>
        {plan.length > 0 && (
          <View style={styles.pillContainer}>
            {plan.map((activity, i) => {
              const [category, label] = activity.split(':').map((s) => s.trim());
              const color = getColorForCategory(category);
              const isDone = completedSet.has(activity);

              return (
                <TouchableOpacity
                  key={`${activity}-${i}`}
                  activeOpacity={0.85}
                  onPress={() => openPillActions(activity, color)}
                  style={[
                    styles.pill,
                    { borderColor: color },
                    isDone ? { backgroundColor: color } : { backgroundColor: 'transparent' },
                  ]}
                >
                  <Text style={[styles.pillText, isDone ? { color: '#fff' } : { color }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Pill actions */}
      <PillModal
        visible={!!actions}
        color={actions?.color ?? '#277da1'}
        title={actions?.title ?? ''}
        completed={!!actions?.completed}
        onToggleComplete={() => {
          if (!actions) return;
          const snapshot = actions;       // keep a copy so we can restore on error
          setActions(null);               // close immediately (snappy UX)
          toggleCompleted.mutate(
            { dateKey: snapshot.dayKey, activity: snapshot.activity },
            {
              // Optional: if the server rejects, bring the pill back
              onError: () => setActions(snapshot),
              // onSettled not needed anymore because we already closed
            }
          );
        }}
        onDelete={() => {
          if (!actions) return;
          const snapshot = actions;
          setActions(null);               // close immediately
          removeActivity.mutate(
            { dateKey: snapshot.dayKey, activity: snapshot.activity },
            {
              onError: () => setActions(snapshot),
            }
          );
        }}
        onClose={() => setActions(null)}
      />
    </Pressable>
  );
});

export default function InfiniteDayScroll() {
  const addActivity = useAddActivity();

  const flatListRef = useRef<FlatList<number>>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const scrollToToday = () => {
    flatListRef.current?.scrollToIndex({ index: START_INDEX, animated: true });
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        initialScrollIndex={START_INDEX}
        getItemLayout={(_, index) => ({
          length: DAY_HEIGHT,
          offset: DAY_HEIGHT * index,
          index,
        })}
        data={Array.from({ length: 20000 }, (_, i) => i - START_INDEX)}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item: dayOffset }) => {
          const day = getDateFromOffset(dayOffset);
          return (
            <DayRow
              day={day}
              onOpenAdd={(d) => {
                setSelectedDate(d);
                setModalVisible(true);
              }}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.floatingContainer}>
        <TouchableOpacity style={styles.floatingButton} onPress={scrollToToday}>
          <Text style={styles.floatingText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Add Activity */}
      {selectedDate && (
        <PlanModal
          visible={modalVisible}
          date={selectedDate}
          onClose={() => setModalVisible(false)}
          onSave={(activities, date) => {
            const dateKey = formatDateKey(date);
            activities.forEach((activity) => {
              // Add already feels instant; if you want perfect symmetry:
              addActivity.mutate(
                { dateKey, activity },
                { onSettled: () => setModalVisible(false) }
              );
            });
          }}
        />
      )}
    </View>
  );
}

// ----- styles -----
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#001f3f' },
  dayCard: {
    height: DAY_HEIGHT - 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  weekendCard: { backgroundColor: '#bbb' },
  dayText: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#222' },
  floatingContainer: { position: 'absolute', bottom: 24, right: 20 },
  floatingButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  floatingText: { color: '#fff', fontWeight: 'bold' },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  dateText: { fontSize: 14, color: '#555' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
});