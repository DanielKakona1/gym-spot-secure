import { StyleSheet, Text, View } from 'react-native';

interface CapacityProgressBarProps {
  currentBookings: number;
  capacityLimit: number;
  fullnessPercentage: number;
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function CapacityProgressBar({ currentBookings, capacityLimit, fullnessPercentage }: CapacityProgressBarProps) {
  const normalizedPercentage = clampPercentage(fullnessPercentage);

  return (
    <View>
      <Text style={styles.readout}>
        {currentBookings}/{capacityLimit} ({normalizedPercentage}%)
      </Text>
      <View style={styles.track}>
        <View testID="capacity-progress-fill" style={[styles.fill, { width: `${normalizedPercentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    color: '#13703A',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  track: {
    marginTop: 8,
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#DCEFE2',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1F8E46',
  },
});
