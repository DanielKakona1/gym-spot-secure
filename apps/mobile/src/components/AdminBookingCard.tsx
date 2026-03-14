import type { Booking } from '@gym-spot/shared-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Pressable style={[styles.actionButton, !canCheckIn && styles.actionButtonDisabled]} disabled={!canCheckIn || isPending} onPress={onCheckIn}>
          <Text style={styles.actionButtonText}>Check In</Text>
        </Pressable>

        <Pressable style={[styles.actionButton, !canCheckOut && styles.actionButtonDisabled]} disabled={!canCheckOut || isPending} onPress={onCheckOut}>
          <Text style={styles.actionButtonText}>Check Out</Text>
        </Pressable>

        <Pressable style={[styles.actionButtonDanger, !canCancel && styles.actionButtonDisabled]} disabled={!canCancel || isPending} onPress={onCancel}>
          <Text style={styles.actionButtonText}>Cancel</Text>
        </Pressable>
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
    borderRadius: 10,
    backgroundColor: '#1F8E46',
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonDanger: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#C9304F',
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    color: '#F2FFF5',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
