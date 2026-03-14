import type { Booking, User } from '@gym-spot/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SearchSelectInput } from '../components/SearchSelectInput';
import { gymService } from '../services/gymService';

function toDateTimeLabel(slotTime: string): string {
  return new Date(slotTime).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toStatusLabel(booking: Booking): string {
  return booking.status ?? 'BOOKED';
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
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showUserResults, setShowUserResults] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => gymService.listUsers(),
  });

  const bookingsQuery = useQuery({
    queryKey: ['user-bookings', selectedUserId],
    queryFn: () => gymService.listUserBookings(selectedUserId),
    enabled: selectedUserId.length > 0,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const userOptions = useMemo(
    () => (usersQuery.data ?? []).filter((user: User) => user.name.toLowerCase().includes(userSearch.trim().toLowerCase())),
    [usersQuery.data, userSearch],
  );

  const actionMutation = useMutation({
    mutationFn: async ({ action, booking }: { action: 'CHECK_IN' | 'CHECK_OUT' | 'CANCEL'; booking: Booking }) => {
      if (action === 'CHECK_IN') {
        return gymService.checkInBooking(booking.gymId, booking.id);
      }
      if (action === 'CHECK_OUT') {
        return gymService.checkOutBooking(booking.gymId, booking.id);
      }
      return gymService.cancelBooking(booking.gymId, booking.id);
    },
    onSuccess: (_booking, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings', variables.booking.userId] });
      queryClient.invalidateQueries({ queryKey: ['capacity'] });
      queryClient.invalidateQueries({ queryKey: ['capacity-by-time'] });
    },
  });

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.title}>Admin</Text>
          <Pressable style={styles.backButton} onPress={onBackToBooking}>
            <Text style={styles.backButtonText}>Go to Booking</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>Manage check-ins, check-outs, and cancellations.</Text>

        <SearchSelectInput
          label="User"
          value={userSearch}
          onChangeText={(text) => {
            setUserSearch(text);
            setShowUserResults(true);
            if (text.trim().length === 0) {
              setSelectedUserId('');
            }
          }}
          onFocus={() => setShowUserResults(true)}
          placeholder={usersQuery.isLoading ? 'Loading users...' : 'Search user'}
          showResults={showUserResults}
          isLoading={usersQuery.isLoading}
          options={userOptions}
          selectedOptionId={selectedUserId}
          getOptionLabel={(user) => user.name}
          onSelectOption={(user) => {
            setSelectedUserId(user.id);
            setUserSearch(user.name);
            setShowUserResults(false);
          }}
          emptyText="No matching users."
        />

        <Text style={styles.label}>Active bookings</Text>
        {selectedUserId.length === 0 && <Text style={styles.hint}>Select a user to view active bookings.</Text>}
        {selectedUserId.length > 0 && bookingsQuery.isLoading && <ActivityIndicator color="#1F8E46" style={styles.state} />}
        {bookingsQuery.isError && <Text style={styles.error}>{bookingsQuery.error.message}</Text>}
        {selectedUserId.length > 0 && !bookingsQuery.isLoading && (bookingsQuery.data?.length ?? 0) === 0 && <Text style={styles.hint}>No active bookings for this user.</Text>}

        {(bookingsQuery.data ?? []).map((booking) => (
          <View key={booking.id} style={styles.card}>
            <Text style={styles.cardTitle}>{toDateTimeLabel(booking.slotTime)}</Text>
            <Text style={styles.cardMeta}>Gym: {booking.gymId}</Text>
            <Text style={styles.cardMeta}>Status: {toStatusLabel(booking)}</Text>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, !canCheckIn(booking) && styles.actionButtonDisabled]}
                disabled={!canCheckIn(booking) || actionMutation.isPending}
                onPress={() => actionMutation.mutate({ action: 'CHECK_IN', booking })}
              >
                <Text style={styles.actionButtonText}>Check In</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, !canCheckOut(booking) && styles.actionButtonDisabled]}
                disabled={!canCheckOut(booking) || actionMutation.isPending}
                onPress={() => actionMutation.mutate({ action: 'CHECK_OUT', booking })}
              >
                <Text style={styles.actionButtonText}>Check Out</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButtonDanger, !canCancel(booking) && styles.actionButtonDisabled]}
                disabled={!canCancel(booking) || actionMutation.isPending}
                onPress={() => actionMutation.mutate({ action: 'CANCEL', booking })}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    color: '#132416',
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  subtitle: {
    color: '#4A6450',
    marginTop: 6,
    marginBottom: 18,
    fontSize: 15,
    fontFamily: 'Poppins',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CEE8D4',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#116F35',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: '#26482E',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
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
