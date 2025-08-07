import { useState } from 'react';
import {
  Button,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Dropdown } from './PickerDropdown'; // Adjust path as needed

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
type Detail = (typeof ACTIVITY_MAP)[Category][number];

export function PlanModal({
  visible,
  onClose,
  onSave,
  date,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (activities: string[]) => void;
  date: string;
}) {
  const [category, setCategory] = useState<Category | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const handleSave = () => {
    if (category && detail) {
      onSave([`${category}: ${detail}`]);
      setCategory(null);
      setDetail(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Plan for {date}</Text>

          <Text style={styles.label}>Category</Text>
          <Dropdown<Category>
            value={category}
            options={Object.keys(ACTIVITY_MAP) as Category[]}
            onSelect={(val) => {
              setCategory(val);
              setDetail(null);
            }}
            labelFormatter={(val) => val ?? 'Choose category'}
          />

          {category && (
            <>
              <Text style={styles.label}>Detail</Text>
              <Dropdown<Detail>
                value={detail}
                options={[...ACTIVITY_MAP[category]]}
                onSelect={setDetail}
                labelFormatter={(val) => val ?? 'Choose detail'}
              />
            </>
          )}


          <View style={styles.actions}>
            <Button title="Cancel" onPress={onClose} />
            <Button
              title="Save"
              onPress={handleSave}
              disabled={!category || !detail}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});
