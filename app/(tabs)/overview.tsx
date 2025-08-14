import CalendarHeatmap from '@/components/CalendarHeatmap';
import { format } from 'date-fns';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OverviewScreen() {
  const today = new Date();
  const formatted = format(today, 'MMMM yyyy');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Overview</Text>

        <View style={[styles.section, styles.fullBleed]}>
          <CalendarHeatmap />
        </View>

        {/* 💡 Future section placeholders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Summary</Text>
          <Text style={styles.placeholder}>Coming soon...</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Graphs</Text>
          <Text style={styles.placeholder}>Coming soon...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholder: {
    color: '#999',
  },
  fullBleed: {
    marginHorizontal: -16,
  }
});
