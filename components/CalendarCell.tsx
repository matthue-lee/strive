import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

// ---- Palette + Category Colors ----
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

type CatDot = { type: string; filled: boolean };
type Rect = { x: number; y: number; w: number; h: number };

type CellProps = {
  date: Date;
  dateKey: string;
  dots: CatDot[];
  inMonth: boolean;
  cellSize: number;
  onPressWithAnchor: (date: Date, anchor: Rect) => void;
  onLayoutCell: (dateKey: string, rect: Rect) => void;
};

function getColorForCategory(raw: string) {
  const key = (raw || '').trim().toLowerCase();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % PALETTE.length;
  return PALETTE[idx];
}

function ActivityDot({ type, dim, filled }: { type: string; dim?: boolean; filled: boolean }) {
  const color = getColorForCategory(type);
  return (
    <View
      style={[
        styles.dot,
        filled ? { backgroundColor: color, borderWidth: 0 } : { borderColor: color, borderWidth: 2 },
        dim ? { opacity: 0.45 } : null,
      ]}
    />
  );
}

export default React.memo(function CalendarCell({
  date, dateKey, dots, inMonth, cellSize, onPressWithAnchor, onLayoutCell,
}: CellProps) {
  const pressScale = useRef(new Animated.Value(1)).current;

  const onLayout = useCallback((e: any) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    onLayoutCell(dateKey, { x, y, w: width, h: height });
  }, [dateKey, onLayoutCell]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPressWithAnchor(date, { x: 0, y: 0, w: cellSize, h: cellSize });
  }, [date, cellSize, onPressWithAnchor]);

  const onIn = useCallback(
    () => Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true }).start(),
    [pressScale]
  );
  const onOut = useCallback(
    () => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start(),
    [pressScale]
  );

  return (
    <Animated.View style={{ width: cellSize, transform: [{ scale: pressScale }] }} onLayout={onLayout}>
      <Pressable style={[styles.cell, !inMonth && styles.cellOut]} onPressIn={onIn} onPressOut={onOut} onPress={handlePress}>
        <View style={styles.cellHeader}>
          <Text style={[styles.dayText, !inMonth && styles.dayTextOut]}>{date.getDate()}</Text>
        </View>
        <View style={styles.dotsRow}>
          {dots.map((d, i) => (
            <ActivityDot key={`${d.type}-${i}`} type={d.type} dim={!inMonth} filled={d.filled} />
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}, (a, b) => (
  a.dateKey === b.dateKey &&
  a.inMonth === b.inMonth &&
  a.cellSize === b.cellSize &&
  a.dots.length === b.dots.length &&
  a.dots.every((d, i) => d.type === b.dots[i].type && d.filled === b.dots[i].filled)
));

const styles = StyleSheet.create({
  dot: { width: 10, height: 10, borderRadius: 5 },
  cell: {
    height: 56, borderRadius: 10, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 4, paddingBottom: 6, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
  cellOut: {
    backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#e5e7eb',
    elevation: 0, shadowOpacity: 0,
  },
  // top-left date number
  cellHeader: {
    height: 20,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 6,
  },
  dayText: { fontSize: 10, lineHeight: 14, fontWeight: '600', color: '#333' },
  dayTextOut: { color: '#9ca3af' },
  dotsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', columnGap: 4, rowGap: 4, marginTop: 4,
  },
});