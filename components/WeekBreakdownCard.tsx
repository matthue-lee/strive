import {
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 3) / 2;

type Activity = {
  label: string;
  icon: React.ReactNode;
  count: number;
  target: number;
};

type Props = {
  startDate: Date;
  activities: Activity[];
};

export function WeekBreakdownCard({ startDate, activities }: Props) {
  const totalCompleted = activities.reduce((sum, a) => sum + a.count, 0);
  const totalTarget = activities.reduce((sum, a) => sum + a.target, 0);

  const formatDate = (date: Date) =>
    `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;

  const renderProgressDots = (count: number, total: number) =>
    Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i < count ? styles.dotActive : styles.dotInactive,
        ]}
      />
    ));


  return (
    <View style={styles.card}>
      <Text style={styles.weekLabel}>Week of: {formatDate(startDate)}</Text>
      <Text style={styles.totalCount}>
        {totalCompleted}/{totalTarget}
      </Text>

      {activities.map((activity, index) => (
        <View key={index} style={styles.activityBlock}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityLabel}>{activity.label}</Text>
            <Text style={styles.activityCount}>
              {activity.count}/{activity.target}
            </Text>
          </View>
          <View style={styles.iconRow}>
            {activity.icon}
            <View style={styles.progressBar}>
              {renderProgressDots(activity.count, activity.target)}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  totalCount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  activityBlock: {
    marginTop: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  activityCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  dot: {
    width: 14,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  dotActive: {
    backgroundColor: '#111',
  },
  dotInactive: {
    backgroundColor: '#ccc',
  },
});
