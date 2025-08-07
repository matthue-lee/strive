import { usePlanStore } from '@/store/usePlanStore';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlanModal } from './PlanModal';

const START_INDEX = 10000;
const screenHeight = Dimensions.get('window').height;
const DAY_HEIGHT = screenHeight / 7;

function getDateFromOffset(offset: number) {
  const today = new Date();
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return date;
}

export function InfiniteDayScroll() {
  const planByDate = usePlanStore((s) => s.planByDate);
  const flatListRef = useRef<FlatList>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const savePlan = usePlanStore((s) => s.savePlan);

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
          const dayName = day.toLocaleDateString('en-NZ', { weekday: 'long' }); // e.g., Monday
          const formattedDate = day.toLocaleDateString('en-NZ'); // e.g., 24/07/2025
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const plan = planByDate[day.toDateString()];

          const cardStyle = [
            styles.dayCard,
            isWeekend && styles.weekendCard,
          ];
          return (
            <View style={cardStyle}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.dayText}>{dayName}</Text>
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>                
                {plan && plan.length > 0 && (
                  <Text style={styles.planPreview}>{plan.join(', ')}</Text>
                )}
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => {
                  setSelectedDate(day);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.planButtonText}>Plan</Text>
              </TouchableOpacity>
            </View>
          );
        }}

        showsVerticalScrollIndicator={false}
      />

      <View style={styles.floatingContainer}>
        <TouchableOpacity style={styles.floatingButton} onPress={scrollToToday}>
          <Text style={styles.floatingText}>Today</Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal */}
      {selectedDate && (
      <PlanModal
        visible={modalVisible}
        date={selectedDate.toDateString()}
        onClose={() => setModalVisible(false)}
        onSave={(activities) => {
          savePlan(selectedDate.toDateString(), activities);
          setModalVisible(false);
        }}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#001f3f', // dark background
  },
  dayCard: {
    height: DAY_HEIGHT - 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  weekendCard: {
    backgroundColor: '#bbb',
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
  },
  planButton: {
    marginTop: 8,
    backgroundColor: '#1e90ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  planButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
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
  floatingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  planPreview: {
  marginTop: 6,
  fontSize: 14,
  color: '#444',
  fontStyle: 'italic',
},
cardTitleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
},

dateText: {
  fontSize: 14,
  color: '#555',
},


});
