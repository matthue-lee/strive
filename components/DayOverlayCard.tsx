// components/DayOverlayCard.tsx
import { format } from 'date-fns';
import React, { memo, useMemo } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const PALETTE = [
  '#f94144','#f3722c','#f8961e','#f9844a','#f9c74f',
  '#90be6d','#43aa8b','#4d908e','#577590','#277da1',
];
const CATEGORY_COLORS: Record<string, string> = {
  run:'#277da1', gym:'#f3722c', surf:'#43aa8b', yoga:'#f9c74f', rest:'#577590',
  swim:'#4d908e', bike:'#90be6d', boxing:'#f94144', hike:'#f8961e', stretch:'#f9844a', climb:'#4d908e',
};
const getColorForCategory = (raw: string) => {
  const key = (raw || '').trim().toLowerCase();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
};

function getUniqueCategoryColors(activities: string[], limit = 6): string[] {
  const seen = new Set<string>();
  const colors: string[] = [];
  for (const a of activities) {
    const cat = a.split(':')[0].trim().toLowerCase();
    if (!seen.has(cat)) {
      seen.add(cat);
      colors.push(getColorForCategory(cat));
      if (colors.length >= limit) break;
    }
  }
  return colors;
}

/** Rings drawn OUTSIDE the card bounds. Does not affect card size. */
function OutsideRings({
  colors,
  baseRadius,
}: {
  colors: string[];
  baseRadius: number;
}) {
  if (colors.length === 0) return null;

  const THICKNESS = 4;
  const GAP = 4;
  const OUTER_MARGIN = 8;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {colors.map((color, idx) => {
        const expand = OUTER_MARGIN + idx * (THICKNESS + GAP);
        const inset = -expand; // expand outward
        return (
          <View
            key={`${color}-${idx}`}
            style={[
              StyleSheet.absoluteFillObject,
              {
                top: inset,
                right: inset,
                bottom: inset,
                left: inset,
                borderRadius: baseRadius + expand,
                borderWidth: THICKNESS,
                borderColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

type Props = {
  visible: boolean;
  date: Date;
  activities: string[];
  completedSet: Set<string>;
  onClose: () => void;
};

const DayOverlayCard = memo(function DayOverlayCard({
  visible,
  date,
  activities,
  completedSet,
  onClose,
}: Props) {
  const ringColors = useMemo(() => getUniqueCategoryColors(activities), [activities]);
  const CARD_RADIUS = 32;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Scrim */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.scrim} />
      </TouchableWithoutFeedback>

      <View style={styles.centeredContainer}>
        {/* FRAME: defines card size; rings are positioned around this without shrinking content */}
        <View style={styles.frame}>
          <OutsideRings colors={ringColors} baseRadius={CARD_RADIUS} />

          {/* CARD: always full width of the frame */}
          <View style={[styles.card, { borderRadius: CARD_RADIUS }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{format(date, 'EEEE, MMM d')}</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {activities.length > 0 ? (
              <FlatList
                data={activities}
                keyExtractor={(item, idx) => `${item}-${idx}`}
                renderItem={({ item }) => {
                  const cat = item.split(':')[0].trim().toLowerCase();
                  const done = completedSet.has(item);
                  const color = getColorForCategory(cat);
                  return (
                    <View style={styles.row}>
                      <View
                        style={[
                          styles.dot,
                          done ? { backgroundColor: color, borderWidth: 0 } : { borderColor: color },
                        ]}
                      />
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  );
                }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={{ paddingBottom: 6 }}
              />
            ) : (
              <Text style={styles.emptyText}>No activities</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default DayOverlayCard;

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /** FRAME: controls the card's visual size; rings are absolute around it */
  frame: {
    position: 'relative',
    // Responsive sizing: tweak to taste
    width: '85%',
    maxWidth: 420,
    // Add a little breathing room so outside rings aren’t clipped near screen edges
    marginHorizontal: 16,
  },

  card: {
    width: '100%',          // fill the frame
    maxHeight: '100%',
    backgroundColor: '#fff',
    padding: 24,            // roomy interior
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { marginLeft: 'auto', padding: 6 },
  closeText: { fontSize: 22, fontWeight: 'bold' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'transparent', borderWidth: 2, marginRight: 8,
  },
  itemText: { fontSize: 16 },
  separator: { height: 1, backgroundColor: '#eee' },
  emptyText: { color: '#888', textAlign: 'center', paddingVertical: 20 },
});