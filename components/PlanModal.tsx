// PlanModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


// ---------- Activity catalog (same structure as your current file) ----------
const ACTIVITY_MAP = {
  Run: ['Interval Run', 'Tempo Run', 'Easy Run', 'Long Run', 'Hill Run', 'Marathon', 'Half Marathon'],
  Gym: ['Push', 'Pull', 'Full Body', 'Core', 'Cardio', 'Upper Body', 'Lower Body'],
  Surf: ['Shortboard', 'Longboard'],
  Rest: ['Full Rest', 'Active Recovery'],
  Climb: ['Bouldering', 'Sport Climbing', 'Trad Climbing'],
  Yoga: ['Hatha', 'Vinyasa', 'Ashtanga', 'Restorative', 'Power Yoga'],
  Swim: ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'Open Water'],
  Bike: ['Road Cycling', 'Mountain Biking', 'Commuting', 'Touring', 'Indoor Cycling'],
  Hike: ['Day Hike', 'Backpacking', 'Trail Running'],
} as const;

type Category = keyof typeof ACTIVITY_MAP;
type DetailByCategory = { [K in Category]: (typeof ACTIVITY_MAP)[K][number] };
type Detail = DetailByCategory[keyof DetailByCategory];

const CATEGORY_OPTIONS = Object.keys(ACTIVITY_MAP) as readonly Category[];
const getDetailsFor = (cat: Category) => ACTIVITY_MAP[cat] as readonly Detail[];

// ---------- Palette + per-category color mapping (same vibe as your list) ----------
const PALETTE = [
  '#f94144', // Imperial red
  '#f3722c', // Orange (Crayola)
  '#f8961e', // Carrot orange
  '#f9844a', // Coral
  '#f9c74f', // Saffron
  '#90be6d', // Pistachio
  '#43aa8b', // Zomp
  '#4d908e', // Dark cyan
  '#577590', // Payne's gray
  '#277da1', // Cerulean
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

function getColorForCategory(raw?: string | null) {
  const key = (raw || '').trim().toLowerCase();
  if (!key) return '#277da1'; // default Cerulean
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  // fallback: simple hash → palette index
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % PALETTE.length;
  return PALETTE[idx];
}

// ---------- Props ----------
type PlanModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (activities: string[], date: Date) => void;
  date: Date;
  initialActivities?: string[];
};

export function PlanModal({ visible, onClose, onSave, date, initialActivities }: PlanModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Detail | null>(null);

  // Prefill from initial activity if valid
  useEffect(() => {
    if (!visible) return;
    let preCat: Category | null = null;
    let preDetail: Detail | null = null;
    const first = initialActivities?.[0];

    if (first) {
      const [rawCat, rawDetail] = first.split(':').map((s) => s.trim());
      if (rawCat && (CATEGORY_OPTIONS as readonly string[]).includes(rawCat)) {
        preCat = rawCat as Category;
        const det = rawDetail as Detail;
        if (preCat && getDetailsFor(preCat).includes(det)) {
          preDetail = det;
        }
      }
    }

    setSelectedCategory(preCat);
    setSelectedDetail(preDetail);
  }, [visible, initialActivities]);

  const color = useMemo(() => getColorForCategory(selectedCategory), [selectedCategory]);
  const canSave = !!(selectedCategory && selectedDetail);

  const handleSave = () => {
    if (!canSave) return;
    onSave([`${selectedCategory}: ${selectedDetail}`], date);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <View style={styles.backdrop}>
        {/* Backdrop press to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.card, { borderColor: color }]}>
          <Text style={[styles.title, { color }]}>Add Activity</Text>

          {/* Category Section */}
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView
            contentContainerStyle={styles.chipsWrap}
            showsVerticalScrollIndicator={false}
            style={styles.scrollBlock}
          >
            {CATEGORY_OPTIONS.map((cat) => {
              const selected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    setSelectedCategory(cat);
                    // reset detail if category changes
                    setSelectedDetail(null);
                  }}
                  activeOpacity={0.9}
                  style={[
                    styles.chip,
                    { borderColor: getColorForCategory(cat) },
                    selected ? { backgroundColor: getColorForCategory(cat) } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected ? { color: '#fff' } : { color: getColorForCategory(cat) },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Detail Section */}
          {selectedCategory && (
            <>
              <Text style={styles.sectionLabel}>Type</Text>
              <ScrollView
                contentContainerStyle={styles.chipsWrap}
                showsVerticalScrollIndicator={false}
                style={[styles.scrollBlock, { maxHeight: 180 }]}
              >
                {getDetailsFor(selectedCategory).map((det) => {
                  const selected = selectedDetail === det;
                  return (
                    <TouchableOpacity
                      key={det}
                      onPress={() => setSelectedDetail(det)}
                      activeOpacity={0.9}
                      style={[
                        styles.chip,
                        { borderColor: color },
                        selected ? { backgroundColor: color } : null,
                      ]}
                    >
                      <Text style={[styles.chipText, selected ? { color: '#fff' } : { color }]}>
                        {det}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}


          {/* Actions */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: canSave ? color : '#c8c8c8' }]}
              onPress={handleSave}
              activeOpacity={canSave ? 0.9 : 1}
              disabled={!canSave}
            >
              <Text style={styles.primaryBtnText}>
                {canSave ? `Add "${selectedCategory}: ${selectedDetail}"` : 'Add Activity'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.ghostText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// If you're using default exports elsewhere, you can also:
// export default PlanModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '92%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2, // colored outline
    paddingVertical: 16,
    paddingHorizontal: 14,
    maxHeight: '85%',
    // soft shadow to match PillModal
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  scrollBlock: {
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    color: '#666',
    fontStyle: 'italic',
  },
  buttons: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  ghostBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 15,
  },
});
