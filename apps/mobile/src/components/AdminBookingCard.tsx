import type { Booking } from '@gym-spot/shared-types';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';

interface AdminBookingCardProps {
  booking: Booking;
  isPending: boolean;
  canCheckIn: boolean;
  canCheckOut: boolean;
  canCancel: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onCancel: () => void;
  formatSlotTime: (slotTime: string) => string;
}

function toStatusLabel(booking: Booking): string {
  return booking.status ?? 'BOOKED';
}

export function AdminBookingCard({
  booking,
  isPending,
  canCheckIn,
  canCheckOut,
  canCancel,
  onCheckIn,
  onCheckOut,
  onCancel,
  formatSlotTime,
}: AdminBookingCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{formatSlotTime(booking.slotTime)}</Text>
      <Text style={styles.cardMeta}>Gym: {booking.gymId}</Text>
      <Text style={styles.cardMeta}>Status: {toStatusLabel(booking)}</Text>

      <View style={styles.actionsRow}>
        <AppButton label="Check In" size="sm" disabled={!canCheckIn || isPending} onPress={onCheckIn} style={styles.actionButton} />
        <AppButton label="Check Out" size="sm" disabled={!canCheckOut || isPending} onPress={onCheckOut} style={styles.actionButton} />
        <AppButton label="Cancel" size="sm" variant="danger" disabled={!canCancel || isPending} onPress={onCancel} style={styles.actionButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#CEE8D4',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 4,
  },
  cardTitle: {
    color: '#143319',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  cardMeta: {
    color: '#355E3F',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});
