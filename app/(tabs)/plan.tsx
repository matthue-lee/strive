import { InfiniteDayScroll } from '@/components/weekView';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarView } from '../../components/calendarView'; // adjust path if needed
import { Dropdown } from '../../components/PickerDropdown';


export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<'week' | 'calendar'>('week');

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toDateString();
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>Strive</Text>

        <Dropdown
          value={viewMode}
          options={['week', 'calendar']}
          onSelect={setViewMode}
          labelFormatter={(v) =>
            v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Select'
          }
        />
      </View>

      {/* Main Content */}
      {viewMode === 'week' ? (
        <InfiniteDayScroll />
      ) : (
        <CalendarView />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#001f3f',
  },
    header: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#001f3f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  picker: {
    height: 40,
    width: 150,
    color: '#fff',
    backgroundColor: '#333',
  },
  body: {
    paddingHorizontal: 16,
  },
  dayCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
