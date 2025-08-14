// components/CalendarHeatmap.tsx
import { supabase } from '@/library/supabase';
import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from 'date-fns';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View, VirtualizedList } from 'react-native';
import CalendarCell from './CalendarCell';
import DayOverlayCard from './DayOverlayCard';


type Rect = { x: number; y: number; w: number; h: number };
// 1) define this once, outside the component (optional micro-optim)
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// -------- data helpers (Supabase) --------
const titleCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const labelOf = (sport: string, subtype?: string | null) =>
  subtype ? `${titleCase(sport)}: ${subtype}` : titleCase(sport);
function asOne<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}
type MonthData = { planByDate: Record<string, string[]>; completedByDate: Record<string, string[]> };

function useMonthRangeData(rangeStart: Date, rangeEnd: Date) {
  const startKey = format(rangeStart, 'yyyy-MM-dd');
  const endKey = format(rangeEnd, 'yyyy-MM-dd');

  return useQuery<MonthData>({
    queryKey: ['month-data', startKey, endKey],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return { planByDate: {}, completedByDate: {} };

      const { data: planned, error: pErr } = await supabase
        .from('activity_planned')
        .select('planned_date, local_date_key, activities:activities!inner(user_id, sport, subtype)')
        .gte('planned_date', startKey)
        .lte('planned_date', endKey)
        .eq('activities.user_id', userId);
      if (pErr) throw pErr;

      const planByDate: Record<string, string[]> = {};
      for (const row of planned ?? []) {
        const act = asOne<any>((row as any).activities);
        if (!act) continue;
        const dateKey = (row as any).local_date_key ?? (row as any).planned_date;
        const label = labelOf(act.sport, act.subtype);
        (planByDate[dateKey] ??= []).push(label);
      }

      const { data: done, error: cErr } = await supabase
        .from('activity_completed')
        .select('local_date, local_date_key, activities:activities!inner(user_id, sport, subtype)')
        .gte('local_date', startKey)
        .lte('local_date', endKey)
        .eq('activities.user_id', userId);
      if (cErr) throw cErr;

      const completedByDate: Record<string, string[]> = {};
      for (const row of done ?? []) {
        const act = asOne<any>((row as any).activities);
        if (!act) continue;
        const dateKey = (row as any).local_date_key ?? (row as any).local_date;
        const label = labelOf(act.sport, act.subtype);
        (completedByDate[dateKey] ??= []).push(label);
      }

      return { planByDate, completedByDate };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// --------------- MonthGrid (memo) ----------------
const MonthGrid = React.memo(function MonthGrid({
  monthDate,
  width,
  onTapCell,
  containerWin, // {x,y} of outer container in window coords
}: {
  monthDate: Date;
  width: number;
  onTapCell: (date: Date, anchor: Rect, activities: string[], completedSet: Set<string>) => void;
  containerWin: { x: number; y: number };
}) {
  const COLS = 7;
  const ROWS = 6;
  const GAP = 6;
  const PAGE_PAD = 12;

  const innerWidth = width - PAGE_PAD * 2;
  const cellSize = useMemo(() => {
    const usable = innerWidth - GAP * (COLS - 1);
    return Math.floor(usable / COLS);
  }, [innerWidth]);

  const gridPadH = useMemo(() => {
    const used = cellSize * COLS + GAP * (COLS - 1);
    const leftover = Math.max(0, innerWidth - used);
    return Math.floor(leftover / 2);
  }, [innerWidth, cellSize]);

  const days = useMemo(() => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const monthDays = eachDayOfInterval({ start, end });
    const lead = getDay(start);
    const totalCells = ROWS * COLS;
    const trail = totalCells - (lead + monthDays.length);
    const prefix = Array.from({ length: lead }, (_, i) => addDays(start, -lead + i));
    const postfix = Array.from({ length: trail }, (_, i) => addDays(end, i + 1));
    return [...prefix, ...monthDays, ...postfix];
  }, [monthDate]);

  // fetch month data
  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];
  const { data } = useMonthRangeData(rangeStart, rangeEnd);
  const planByDate = data?.planByDate ?? {};
  const completedByDate = data?.completedByDate ?? {};

  type DotFlag = { type: string; filled: boolean };

  const dayMeta = useMemo(() => {
    const map: Record<string, { dots: DotFlag[]; anyPlanned: boolean }> = {};
    for (const dateKey in planByDate) {
      const activities = planByDate[dateKey];
      const completedArr = completedByDate[dateKey] ?? [];
      // faster than Set for small arrays: boolean map
      const completedMap: Record<string, true> = {};
      for (const c of completedArr) completedMap[c] = true;

      const perCat: Record<string, { total: number; done: number }> = {};
      for (const a of activities) {
        const cat = a.split(':')[0].trim().toLowerCase();
        perCat[cat] ??= { total: 0, done: 0 };
        perCat[cat].total++;
        if (completedMap[a]) perCat[cat].done++;
      }
      const dots = Object.keys(perCat).map(cat => ({
        type: cat,
        filled: perCat[cat].done > 0 && perCat[cat].done === perCat[cat].total,
      }));
      map[dateKey] = { dots, anyPlanned: activities.length > 0 };
    }
    return map;
  }, [planByDate, completedByDate]);


  // ---- cache rects ----
  const gridRef = useRef<View>(null);
  const gridAbs = useRef<Rect>({ x: 0, y: 0, w: 0, h: 0 }); // relative to container
  const cellRects = useRef<Record<string, Rect>>({}); // dateKey -> rect (relative to grid)
  const onLayoutCell = useCallback((dateKey: string, rect: Rect) => {
    cellRects.current[dateKey] = rect;
  }, []);

  // ✅ new wrapper: (date, fallback) => void  (matches CalendarCell)
  const onPressWithAnchor = useCallback((date: Date, fallback: Rect) => {
    const dateKey = format(date, 'yyyy-MM-dd');

    const cell = cellRects.current[dateKey];
    const grid = gridAbs.current;

    const anchor: Rect = cell
      ? { x: grid.x + cell.x, y: grid.y + cell.y, w: cell.w, h: cell.h }
      : { x: grid.x, y: grid.y, w: fallback.w, h: fallback.h };

    // Lookup only when needed for the popover
    const activities = planByDate[dateKey] ?? [];
    const completedSet = new Set((completedByDate[dateKey] ?? []) as string[]);

    onTapCell(date, anchor, activities, completedSet);
  }, [onTapCell, planByDate, completedByDate]);
  // Measure grid ON LAYOUT using window coords and convert to container coords (reliable in Fabric)
  const measureGrid = useCallback(() => {
    gridRef.current?.measureInWindow?.((gx: number, gy: number, gw: number, gh: number) => {
      gridAbs.current = { x: gx - containerWin.x, y: gy - containerWin.y, w: gw, h: gh };
    });
  }, [containerWin.x, containerWin.y]);

  const onGridLayout = useCallback(() => {
    // give RN a frame to settle, then measure
    requestAnimationFrame(measureGrid);
  }, [measureGrid]);

  return (
    <View style={[styles.page, { width, paddingHorizontal: PAGE_PAD, paddingVertical: PAGE_PAD }]}>
      <Text style={styles.monthTitle}>{format(monthDate, 'MMMM yyyy')}</Text>

      <View style={[styles.weekHeader, { paddingHorizontal: gridPadH, columnGap: GAP }]}>
        {WEEKDAYS.map(wd => (
          <View key={wd} style={{ width: cellSize, alignItems: 'center' }}>
            <Text style={styles.weekLabel}>{wd}</Text>
          </View>
        ))}
      </View>

      <View
        ref={gridRef}
        onLayout={onGridLayout}
        style={[styles.grid, { paddingHorizontal: gridPadH, columnGap: GAP, rowGap: GAP }]}
      >
        {days.map((date) => {
          const inMonth = date.getMonth() === monthDate.getMonth();
          const dateKey = format(date, 'yyyy-MM-dd');
          const { dots = [] } = dayMeta[dateKey] ?? {};

          return (
            <CalendarCell
              key={dateKey}
              date={date}
              dateKey={dateKey}
              dots={dots}
              inMonth={inMonth}
              cellSize={cellSize}
              onLayoutCell={onLayoutCell} 
              onPressWithAnchor={onPressWithAnchor} 
            />
          );
        })}
      </View>
    </View>
  );
});

export default function CalendarHeatmap() {
  const containerRef = useRef<View>(null);
  const [containerWin, setContainerWin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const onContainerLayout = useCallback(() => {
    containerRef.current?.measureInWindow?.((x: number, y: number) => setContainerWin({ x, y }));
  }, []);

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverData, setPopoverData] = useState<{
    date: Date;
    activities: string[];
    completedSet: Set<string>;
  } | null>(null);

  const [anchor, setAnchor] = useState<Rect | null>(null);
  const [placement, setPlacement] = useState<'above' | 'below'>('below');

  const { width, height: viewportH } = Dimensions.get('window');

  // How many months do we want to expose? Be sane:
  const PAST = 36;     // past 3 years
  const FUTURE = 24;   // next 2 years
  const TOTAL = PAST + FUTURE + 1; // inclusive of "this month"
  const START_INDEX = PAST;        // zero-based index for "current month"
  const monthListRef = useRef<VirtualizedList<number>>(null);

  const getItem = useCallback((_data: any, index: number) => index - START_INDEX, [START_INDEX]);
  const getItemCount = useCallback(() => TOTAL, [TOTAL]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), [width]);

  const snapToNearest = useCallback((e: any) => {
    const x = e?.nativeEvent?.contentOffset?.x ?? 0;
    const idx = Math.round(x / width);
    monthListRef.current?.scrollToIndex({ index: idx, animated: true });
  }, [width]);

  const handleTapCell = useCallback((date: Date, anchorRect: Rect, activities: string[], completedSet: Set<string>) => {
    const preferred = anchorRect.y < viewportH * 0.55 ? 'below' : 'above';
    setAnchor(anchorRect);
    setPlacement(preferred);
    setPopoverData({ date, activities, completedSet });
    setPopoverVisible(true);
  }, [viewportH]);

  return (
    <View ref={containerRef} style={{ flex: 1 }} onLayout={onContainerLayout}>
      <VirtualizedList
        ref={monthListRef}
        horizontal
        pagingEnabled
        snapToInterval={width}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItem={getItem}
        getItemCount={getItemCount}
        keyExtractor={(index) => String(index)}     // index is stable here
        initialScrollIndex={START_INDEX}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={snapToNearest}
        renderItem={({ item: monthOffset }) => {
          const monthDate = addMonths(new Date(), monthOffset);
          return (
            <MonthGrid
              monthDate={monthDate}
              width={width}
              onTapCell={handleTapCell}
              containerWin={containerWin}
            />
          );
        }}
      />

      {/* Selection outline */}
      {anchor && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: anchor.x - 6,
            top: anchor.y - 6,
            width: anchor.w + 12,
            height: anchor.h + 12,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: 'rgba(39,125,161,0.8)',
            backgroundColor: 'rgba(39,125,161,0.08)',
            zIndex: 9999, 
          }}
        />
      )}

      <DayOverlayCard
        visible={popoverVisible && !!popoverData}
        date={popoverData?.date ?? new Date()}
        activities={popoverData?.activities ?? []}
        completedSet={popoverData?.completedSet ?? new Set()}
        onClose={() => {
          setPopoverVisible(false);
          setAnchor(null);
        }}
      />
    </View>
  );
}

// ---- styles ----
const styles = StyleSheet.create({
  page: { paddingTop: 8, paddingBottom: 16 },
  monthTitle: { textAlign: 'center', fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#222' },
  weekHeader: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 6 },
  weekLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  cell: {
    height: 56, borderRadius: 10, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 4, paddingBottom: 6, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
  cellOut: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#e5e7eb', elevation: 0, shadowOpacity: 0 },
  cellHeader: { height: 20, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 16, fontWeight: '600', color: '#333' },
  dayTextOut: { color: '#9ca3af' },
  dotsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 4, rowGap: 4, marginTop: 4 },
});