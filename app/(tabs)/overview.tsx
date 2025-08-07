import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Tab() {
  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <Text>Tab [Home|Overview]</Text>
        </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
safeArea: {
    flex: 1,
    backgroundColor: '#001f3f',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
