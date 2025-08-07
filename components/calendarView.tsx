import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <View>
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={
          selectedDate
            ? {
                [selectedDate]: {
                  selected: true,
                  selectedColor: '#00adf5',
                },
              }
            : {}
        }
        style={styles.calendar}
      />
      {selectedDate && (
        <Text style={styles.selection}>Planning for: {selectedDate}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    borderRadius: 10,
    marginHorizontal: 16,
  },
  selection: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
