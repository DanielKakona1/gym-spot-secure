import type { Booking, User } from '@gym-spot/shared-types';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AdminBookingCard } from '../components/AdminBookingCard';
import { NoticesStack } from '../components/NoticesStack';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionLabel } from '../components/SectionLabel';
import { SearchSelectInput } from '../components/SearchSelectInput';
import { useBookingAdminActions } from '../hooks/useBookingAdminActions';
import { useUserBookings } from '../hooks/useUserBookings';
import { useSearchSelect } from '../hooks/useSearchSelect';
import { useUsers } from '../hooks/useUsers';
import { formatDateTimeLabel } from '../lib/formatters';

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

        <SectionLabel label="Active bookings" />
        <NoticesStack
          notices={[
            selectedUserId.length === 0 && { key: 'select-user', message: 'Select a user to view active bookings.' },
            bookingsQuery.isError && {
              key: 'bookings-error',
              message: bookingsQuery.error.message,
              variant: 'error',
            },
            selectedUserId.length > 0 &&
              !bookingsQuery.isLoading &&
              (bookingsQuery.data?.length ?? 0) === 0 && {
                key: 'no-bookings',
                message: 'No active bookings for this user.',
              },
            actionMutation.isError && {
              key: 'action-error',
              message: actionMutation.error.message,
              variant: 'error',
            },
          ]}
          showLoading={(selectedUserId.length > 0 && bookingsQuery.isLoading) || actionMutation.isPending}
        />

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
            formatSlotTime={formatDateTimeLabel}
          />
        ))}
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
});
