import type { Booking } from '@gym-spot/shared-types';
import { StyleSheet, Text, View } from 'react-native';

interface BookingActiveBookingsCardProps {
  bookings: Booking[];
  resolveGymLabel: (gymId: string) => string;
  formatSlotTime: (slotTime: string) => string;
}

function toBookingStatus(booking: Booking): NonNullable<Booking['status']> {
  return booking.status ?? 'BOOKED';
}

export function BookingActiveBookingsCard({
  bookings,
  resolveGymLabel,
  formatSlotTime,
}: BookingActiveBookingsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Active booking</Text>
      {bookings.map((booking) => {
        const status = toBookingStatus(booking);
        return (
          <View key={booking.id} style={styles.row}>
            <View style={styles.body}>
              <Text style={styles.time}>{formatSlotTime(booking.slotTime)}</Text>
              <Text style={styles.gym}>{resolveGymLabel(booking.gymId)}</Text>
            </View>
            <Text style={[styles.statusBadge, status === 'CHECKED_IN' ? styles.statusCheckedIn : styles.statusBooked]}>
              {status === 'CHECKED_IN' ? 'Checked In' : 'Booked'}
            </Text>
          </View>
        );
      })}
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
    gap: 8,
  },
  title: {
    color: '#1D3D20',
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  body: {
    flex: 1,
  },
  time: {
    color: '#143319',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  gym: {
    color: '#486F4E',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Poppins',
    overflow: 'hidden',
  },
  statusBooked: {
    color: '#0F6D34',
    backgroundColor: '#EAF7EE',
  },
  statusCheckedIn: {
    color: '#0E4F7A',
    backgroundColor: '#E7F3FF',
  },
});
