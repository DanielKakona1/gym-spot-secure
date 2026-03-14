import type { Booking, User } from '@gym-spot/shared-types';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminBookingCard } from '../components/AdminBookingCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchSelectInput } from '../components/SearchSelectInput';
import { useBookingAdminActions } from '../hooks/useBookingAdminActions';
import { useUserBookings } from '../hooks/useUserBookings';
import { useSearchSelect } from '../hooks/useSearchSelect';
import { useUsers } from '../hooks/useUsers';

function toDateTimeLabel(slotTime: string): string {
  return new Date(slotTime).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function canCheckIn(booking: Booking): boolean {
  return (booking.status ?? 'BOOKED') === 'BOOKED';
}

function canCheckOut(booking: Booking): boolean {
  return booking.status === 'CHECKED_IN';
}

function canCancel(booking: Booking): boolean {
  return (booking.status ?? 'BOOKED') === 'BOOKED';
}

interface Props {
  onBackToBooking: () => void;
}

export function AdminScreen({ onBackToBooking }: Props) {
  const [selectedUserId, setSelectedUserId] = useState('');

  const usersQuery = useUsers();
  const userSelect = useSearchSelect<User>({
    options: usersQuery.data ?? [],
    getOptionLabel: (user) => user.name,
    onClear: () => {
      setSelectedUserId('');
    },
  });
  const bookingsQuery = useUserBookings(selectedUserId);

  const actionMutation = useBookingAdminActions();

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Admin"
          subtitle="Manage check-ins, check-outs, and cancellations."
          actionLabel="Go to Booking"
          onActionPress={onBackToBooking}
        />

        <SearchSelectInput
          label="User"
          value={userSelect.searchValue}
          onChangeText={userSelect.onChangeText}
          onFocus={userSelect.onFocus}
          placeholder={usersQuery.isLoading ? 'Loading users...' : 'Search user'}
          showResults={userSelect.showResults}
          isLoading={usersQuery.isLoading}
          options={userSelect.filteredOptions}
          selectedOptionId={selectedUserId}
          getOptionLabel={(user) => user.name}
          onSelectOption={(user) => {
            setSelectedUserId(user.id);
            userSelect.onSelectOption(user);
          }}
          emptyText="No matching users."
        />

        <Text style={styles.label}>Active bookings</Text>
        {selectedUserId.length === 0 && <Text style={styles.hint}>Select a user to view active bookings.</Text>}
        {selectedUserId.length > 0 && bookingsQuery.isLoading && <ActivityIndicator color="#1F8E46" style={styles.state} />}
        {bookingsQuery.isError && <Text style={styles.error}>{bookingsQuery.error.message}</Text>}
        {selectedUserId.length > 0 && !bookingsQuery.isLoading && (bookingsQuery.data?.length ?? 0) === 0 && <Text style={styles.hint}>No active bookings for this user.</Text>}

        {(bookingsQuery.data ?? []).map((booking) => (
          <AdminBookingCard
            key={booking.id}
            booking={booking}
            isPending={actionMutation.isPending}
            canCheckIn={canCheckIn(booking)}
            canCheckOut={canCheckOut(booking)}
            canCancel={canCancel(booking)}
            onCheckIn={() => actionMutation.mutate({ action: 'CHECK_IN', booking })}
            onCheckOut={() => actionMutation.mutate({ action: 'CHECK_OUT', booking })}
            onCancel={() => actionMutation.mutate({ action: 'CANCEL', booking })}
            formatSlotTime={toDateTimeLabel}
          />
        ))}

        {actionMutation.isPending && <ActivityIndicator color="#1F8E46" style={styles.state} />}
        {actionMutation.isError && <Text style={styles.error}>{actionMutation.error.message}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F6FAF7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 24,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: '#26482E',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  hint: {
    marginTop: 8,
    color: '#486F4E',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  state: {
    marginTop: 10,
  },
  error: {
    marginTop: 8,
    color: '#C9304F',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
});
