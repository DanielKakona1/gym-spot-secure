import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CapacityProgressBar } from './CapacityProgressBar';

interface LiveCapacityCardProps {
  title?: string;
  isLoading: boolean;
  data?: {
    currentBookings: number;
    capacityLimit: number;
    fullnessPercentage: number;
  };
  errorMessage?: string;
}

export function LiveCapacityCard({
  title = 'Live Capacity',
  isLoading,
  data,
  errorMessage,
}: LiveCapacityCardProps) {
  return (
    <View style={styles.capacityBox}>
      <Text style={styles.capacityTitle}>{title}</Text>
      {isLoading && <ActivityIndicator testID="capacity-loading" color="#1F8E46" />}
      {data && (
        <CapacityProgressBar
          currentBookings={data.currentBookings}
          capacityLimit={data.capacityLimit}
          fullnessPercentage={data.fullnessPercentage}
        />
      )}
      {errorMessage && (
        <Text testID="capacity-error" style={styles.error}>
          {errorMessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  capacityBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#EEF7F0',
    borderColor: '#CEE8D4',
    borderWidth: 1,
  },
  capacityTitle: {
    color: '#1D3D20',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  error: {
    marginTop: 8,
    color: '#C9304F',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
});
