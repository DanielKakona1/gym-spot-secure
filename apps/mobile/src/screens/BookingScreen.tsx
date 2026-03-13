import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { Booking, Gym, User } from '@gym-spot/shared-types';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CapacityProgressBar } from '../components/CapacityProgressBar';
import { useBookSlot } from '../hooks/useBookSlot';
import { useCapacity } from '../hooks/useCapacity';
import { gymService } from '../services/gymService';

const TIME_OPTIONS = [
  { key: '06:00', label: '06:00' },
  { key: '08:00', label: '08:00' },
  { key: '10:00', label: '10:00' },
  { key: '12:00', label: '12:00' },
  { key: '14:00', label: '14:00' },
  { key: '16:00', label: '16:00' },
  { key: '18:00', label: '18:00' },
  { key: '20:00', label: '20:00' },
] as const;

function toSlotIso(dateKey: string, timeKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = timeKey.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return localDate.toISOString();
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });
}

function toGymLabel(gym: Gym): string {
  return gym.location ? `${gym.name} — ${gym.location}` : gym.name;
}

function toBookingDateTimeLabel(slotTime: string): string {
  return new Date(slotTime).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toBookingStatus(booking: Booking): NonNullable<Booking['status']> {
  return booking.status ?? 'BOOKED';
}

function startOfToday(): Date {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function isTimeSlotInPast(selectedDate: Date | null, timeKey: string): boolean {
  if (!selectedDate) {
    return false;
  }
  const [hours, minutes] = timeKey.split(':').map(Number);
  const slot = new Date(selectedDate);
  slot.setHours(hours, minutes, 0, 0);
  return slot.getTime() < Date.now();
}

interface Props {
  onGoToAdmin: () => void;
}

export function BookingScreen({ onGoToAdmin }: Props) {
  const queryClient = useQueryClient();
  const [selectedGymId, setSelectedGymId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(startOfToday());
  const [selectedTimeKey, setSelectedTimeKey] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gymSearch, setGymSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showGymResults, setShowGymResults] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const minimumDate = useMemo(() => startOfToday(), []);

  const gymsQuery = useQuery({
    queryKey: ['gyms'],
    queryFn: () => gymService.listGyms(),
  });
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => gymService.listUsers(),
  });
  const userBookingsQuery = useQuery({
    queryKey: ['user-bookings', selectedUserId],
    queryFn: () => gymService.listUserBookings(selectedUserId),
    enabled: selectedUserId.length > 0,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const selectedDateKey = useMemo(() => (selectedDate ? toDateKey(selectedDate) : ''), [selectedDate]);

  const bookedTimeKeysForDate = useMemo(() => {
    const bookings = userBookingsQuery.data ?? [];
    return new Set(
      bookings
        .filter((booking: Booking) => booking.gymId === selectedGymId && toDateKey(new Date(booking.slotTime)) === selectedDateKey)
        .map((booking: Booking) => {
          const slotDate = new Date(booking.slotTime);
          const hh = String(slotDate.getHours()).padStart(2, '0');
          const mm = String(slotDate.getMinutes()).padStart(2, '0');
          return `${hh}:${mm}`;
        }),
    );
  }, [selectedDateKey, selectedGymId, userBookingsQuery.data]);

  const selectedTimeIsBooked = bookedTimeKeysForDate.has(selectedTimeKey);
  const canSelectDateTime = selectedGymId.length > 0 && selectedUserId.length > 0;
  const hasActiveBookingForSelectedDay = useMemo(() => {
    if (!selectedDateKey) {
      return false;
    }
    return (userBookingsQuery.data ?? []).some((booking: Booking) => toDateKey(new Date(booking.slotTime)) === selectedDateKey);
  }, [selectedDateKey, userBookingsQuery.data]);
  const slotCapacityQueries = useQueries({
    queries: TIME_OPTIONS.map((option) => ({
      queryKey: ['capacity-by-time', selectedGymId, selectedDateKey, option.key],
      queryFn: () => gymService.getCapacity(selectedGymId, toSlotIso(selectedDateKey, option.key)),
      enabled: selectedGymId.length > 0 && selectedDateKey.length > 0,
    })),
  });
  const fullTimeKeys = useMemo(() => {
    const keys = new Set<string>();
    slotCapacityQueries.forEach((query, index) => {
      if (query.data && query.data.currentBookings >= query.data.capacityLimit) {
        keys.add(TIME_OPTIONS[index].key);
      }
    });
    return keys;
  }, [slotCapacityQueries]);
  const selectedTimeIsPast = isTimeSlotInPast(selectedDate, selectedTimeKey);
  const selectedTimeIsFullFromSlots = fullTimeKeys.has(selectedTimeKey);
  const hasFullSlots = fullTimeKeys.size > 0;
  const allSlotsFullForGymBySlots = fullTimeKeys.size >= TIME_OPTIONS.length;
  const capacityTimeKey =
    selectedTimeKey ||
    TIME_OPTIONS.find((option) => !isTimeSlotInPast(selectedDate, option.key) && !fullTimeKeys.has(option.key))?.key ||
    TIME_OPTIONS[0].key;
  const slotIso = selectedDateKey && selectedGymId ? toSlotIso(selectedDateKey, capacityTimeKey) : '';

  const capacityQuery = useCapacity(selectedGymId, slotIso);
  const allSlotsFullForGymByCapacity = Boolean(
    capacityQuery.data && capacityQuery.data.currentBookings >= capacityQuery.data.capacityLimit,
  );
  const allSlotsFullForGym = allSlotsFullForGymBySlots || allSlotsFullForGymByCapacity;
  const selectedTimeIsFull = selectedTimeIsFullFromSlots || allSlotsFullForGym;
  const bookMutation = useBookSlot(selectedGymId);
  const gymsById = useMemo(() => {
    const map = new Map<string, Gym>();
    (gymsQuery.data ?? []).forEach((gym) => map.set(gym.id, gym));
    return map;
  }, [gymsQuery.data]);

  const gymOptions = useMemo(
    () => (gymsQuery.data ?? []).filter((gym: Gym) => gym.name.toLowerCase().includes(gymSearch.trim().toLowerCase())),
    [gymsQuery.data, gymSearch],
  );
  const userOptions = useMemo(
    () => (usersQuery.data ?? []).filter((user: User) => user.name.toLowerCase().includes(userSearch.trim().toLowerCase())),
    [usersQuery.data, userSearch],
  );

  useEffect(() => {
    if (!canSelectDateTime || !selectedDateKey) {
      setSelectedTimeKey('');
      return;
    }
    if (!selectedTimeKey) {
      return;
    }
    if (selectedTimeKey && !isTimeSlotInPast(selectedDate, selectedTimeKey) && !fullTimeKeys.has(selectedTimeKey) && !allSlotsFullForGym) {
      return;
    }
    const firstAvailable = TIME_OPTIONS.find(
      (option) => !allSlotsFullForGym && !isTimeSlotInPast(selectedDate, option.key) && !fullTimeKeys.has(option.key),
    );
    setSelectedTimeKey(firstAvailable?.key ?? '');
  }, [allSlotsFullForGym, canSelectDateTime, selectedDateKey, selectedDate, fullTimeKeys, selectedTimeKey]);

  useEffect(() => {
    if (!bookMutation.isSuccess) {
      return;
    }
    setShowSuccessNotice(true);
    const timer = setTimeout(() => {
      setShowSuccessNotice(false);
      bookMutation.reset();
    }, 2200);
    return () => clearTimeout(timer);
  }, [bookMutation, bookMutation.isSuccess]);

  const onChangeDate = (_event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (value) {
      setSelectedDate(new Date(value.getFullYear(), value.getMonth(), value.getDate()));
    }
  };

  const onSubmit = () => {
    if (!selectedGymId || !selectedUserId || !selectedDateKey || !selectedTimeKey) {
      setFormError('Please select gym, user, date, and time.');
      return;
    }
    if (hasActiveBookingForSelectedDay) {
      setFormError('This user already has an active booking for this day.');
      return;
    }
    if (allSlotsFullForGym) {
      setFormError('This gym is fully booked for this date.');
      return;
    }
    if (selectedTimeIsBooked) {
      setFormError('This user already booked this exact slot. Choose another time.');
      return;
    }
    if (selectedTimeIsPast) {
      setFormError('This time slot has already passed.');
      return;
    }
    if (selectedTimeIsFull) {
      setFormError('This time slot is full.');
      return;
    }

    setFormError(null);
    bookMutation.mutate({
      userId: selectedUserId,
      slotTime: toSlotIso(selectedDateKey, selectedTimeKey),
    });
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.overlay}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Spot Secure</Text>
            <Pressable style={styles.adminButton} onPress={onGoToAdmin}>
              <Text style={styles.adminButtonText}>Go to Admin</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Book your training slot in seconds.</Text>

          <Text style={styles.label}>Gym</Text>
          <TextInput
            value={gymSearch}
            onChangeText={(text) => {
              setGymSearch(text);
              setShowGymResults(true);
              if (text.trim().length === 0) {
                setSelectedGymId('');
                setSelectedTimeKey('');
              }
            }}
            onFocus={() => {
              setShowGymResults(true);
              setShowUserResults(false);
            }}
            placeholder={gymsQuery.isLoading ? 'Loading gyms...' : 'Search gym'}
            placeholderTextColor="#8AA091"
            style={styles.input}
          />
          {showGymResults && (
            <View style={styles.resultsCard}>
              {gymsQuery.isLoading && <ActivityIndicator color="#1F8E46" style={styles.state} />}
              {!gymsQuery.isLoading && gymOptions.length === 0 && <Text style={styles.emptyText}>No matching gyms.</Text>}
              {!gymsQuery.isLoading &&
                gymOptions.map((gym) => {
                  const active = gym.id === selectedGymId;
                  return (
                    <Pressable
                      key={gym.id}
                      style={[styles.resultRow, active && styles.resultRowActive]}
                      onPress={() => {
                        setSelectedGymId(gym.id);
                        setGymSearch(toGymLabel(gym));
                        setSelectedTimeKey('');
                        setShowGymResults(false);
                        setFormError(null);
                        queryClient.invalidateQueries({ queryKey: ['capacity-by-time'] });
                        queryClient.invalidateQueries({ queryKey: ['capacity'] });
                      }}
                    >
                      <Text style={[styles.resultText, active && styles.resultTextActive]}>{toGymLabel(gym)}</Text>
                    </Pressable>
                  );
                })}
            </View>
          )}

          <Text style={styles.label}>User</Text>
          <TextInput
            value={userSearch}
            onChangeText={(text) => {
              setUserSearch(text);
              setShowUserResults(true);
              if (text.trim().length === 0) {
                setSelectedUserId('');
                setSelectedTimeKey('');
              }
            }}
            onFocus={() => {
              setShowUserResults(true);
              setShowGymResults(false);
            }}
            placeholder={usersQuery.isLoading ? 'Loading users...' : 'Search user'}
            placeholderTextColor="#8AA091"
            style={styles.input}
          />
          {showUserResults && (
            <View style={styles.resultsCard}>
              {usersQuery.isLoading && <ActivityIndicator color="#1F8E46" style={styles.state} />}
              {!usersQuery.isLoading && userOptions.length === 0 && <Text style={styles.emptyText}>No matching users.</Text>}
              {!usersQuery.isLoading &&
                userOptions.map((user) => {
                  const active = user.id === selectedUserId;
                  return (
                    <Pressable
                      key={user.id}
                      style={[styles.resultRow, active && styles.resultRowActive]}
                      onPress={() => {
                        setSelectedUserId(user.id);
                        setUserSearch(user.name);
                        setSelectedTimeKey('');
                        setShowUserResults(false);
                        setFormError(null);
                        queryClient.invalidateQueries({ queryKey: ['user-bookings', user.id] });
                      }}
                    >
                      <Text style={[styles.resultText, active && styles.resultTextActive]}>{user.name}</Text>
                    </Pressable>
                  );
                })}
            </View>
          )}
          {selectedUserId.length > 0 && (userBookingsQuery.data?.length ?? 0) > 0 && (
            <View style={styles.activeBookingsCard}>
              <Text style={styles.activeBookingsTitle}>Active booking</Text>
              {(userBookingsQuery.data ?? []).map((booking) => {
                const status = toBookingStatus(booking);
                const gymLabel = gymsById.has(booking.gymId) ? toGymLabel(gymsById.get(booking.gymId) as Gym) : booking.gymId;
                return (
                  <View key={booking.id} style={styles.activeBookingRow}>
                    <View style={styles.activeBookingBody}>
                      <Text style={styles.activeBookingTime}>{toBookingDateTimeLabel(booking.slotTime)}</Text>
                      <Text style={styles.activeBookingGym}>{gymLabel}</Text>
                    </View>
                    <Text
                      style={[
                        styles.statusBadge,
                        status === 'CHECKED_IN' ? styles.statusBadgeCheckedIn : styles.statusBadgeBooked,
                      ]}
                    >
                      {status === 'CHECKED_IN' ? 'Checked In' : 'Booked'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.label}>Date</Text>
          <Pressable style={[styles.input, !canSelectDateTime && styles.inputDisabled]} onPress={() => setShowDatePicker((prev) => !prev)} disabled={!canSelectDateTime}>
            <Text style={[styles.inputValue, !selectedDate && styles.inputPlaceholder]}>
              {selectedDate ? toDateLabel(selectedDate) : 'Select date'}
            </Text>
          </Pressable>
          {showDatePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker value={selectedDate ?? minimumDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} minimumDate={minimumDate} onChange={onChangeDate} />
              {Platform.OS === 'ios' && (
                <Pressable style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              )}
            </View>
          )}

          <Text style={styles.label}>Time</Text>
          <View style={styles.timeGrid}>
            {TIME_OPTIONS.map((option) => {
              const isBooked = bookedTimeKeysForDate.has(option.key);
              const isPast = isTimeSlotInPast(selectedDate, option.key);
              const isFull = allSlotsFullForGym || fullTimeKeys.has(option.key);
              const isSelected = option.key === selectedTimeKey;
              return (
                <Pressable key={option.key} style={[styles.timeChip, isSelected && styles.timeChipSelected, (!canSelectDateTime || isPast || isFull) && styles.timeChipDisabled]} onPress={() => setSelectedTimeKey(option.key)} disabled={!canSelectDateTime || isPast || isFull}>
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>{option.label}</Text>
                  <Text
                    style={[
                      styles.timeChipBadge,
                      isPast ? styles.timeChipBadgePast : isFull ? styles.timeChipBadgeFull : !isBooked && styles.timeChipBadgeHidden,
                    ]}
                  >
                    {isPast ? 'Past' : isFull ? 'Full' : 'Booked'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!canSelectDateTime && <Text style={styles.hint}>Select gym and user first to enable date and time.</Text>}
          {hasActiveBookingForSelectedDay && <Text style={styles.hint}>This user already has an active booking for this day.</Text>}
          {hasFullSlots && <Text style={styles.hint}>Full slots are disabled.</Text>}
          {selectedUserId.length > 0 && userBookingsQuery.isLoading && <Text style={styles.hint}>Refreshing this user’s booked slots…</Text>}
          {allSlotsFullForGym && <Text style={styles.error}>This gym is fully booked for this date.</Text>}
          {selectedTimeIsBooked && <Text style={styles.error}>This selected time is already booked for this user.</Text>}
          {formError && <Text style={styles.error}>{formError}</Text>}
          {bookMutation.isPending && <ActivityIndicator color="#1F8E46" style={styles.state} />}
          {showSuccessNotice && <Text testID="booking-success" style={styles.success}>Booking confirmed.</Text>}
          {bookMutation.isError && <Text testID="booking-error" style={styles.error}>{bookMutation.error.message}</Text>}

        </View>
      </ScrollView>
      <View style={styles.bottomStack}>
        <View style={styles.capacityBox}>
          <Text style={styles.capacityTitle}>Live Capacity</Text>
          {capacityQuery.isLoading && <ActivityIndicator testID="capacity-loading" color="#1F8E46" />}
          {capacityQuery.data && (
            <CapacityProgressBar
              currentBookings={capacityQuery.data.currentBookings}
              capacityLimit={capacityQuery.data.capacityLimit}
              fullnessPercentage={capacityQuery.data.fullnessPercentage}
            />
          )}
          {capacityQuery.isError && (
            <Text testID="capacity-error" style={styles.error}>
              {capacityQuery.error.message}
            </Text>
          )}
        </View>
        <Pressable style={[styles.submitButton, (bookMutation.isPending || hasActiveBookingForSelectedDay || selectedTimeIsBooked || selectedTimeIsPast || selectedTimeIsFull || allSlotsFullForGym || !selectedTimeKey || !canSelectDateTime || !selectedDate) && styles.submitButtonDisabled]} onPress={onSubmit} disabled={bookMutation.isPending || hasActiveBookingForSelectedDay || selectedTimeIsBooked || selectedTimeIsPast || selectedTimeIsFull || allSlotsFullForGym || !selectedTimeKey || !canSelectDateTime || !selectedDate}>
          <Text style={styles.submitButtonText}>Book Slot</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 220,
  },
  overlay: {
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleIcon: {
    fontSize: 26,
  },
  title: {
    color: '#132416',
    fontSize: 36,
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
  adminButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CEE8D4',
    backgroundColor: '#FFFFFF',
  },
  adminButtonText: {
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
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D2E3D7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    color: '#17281A',
    fontSize: 16,
    justifyContent: 'center',
    fontFamily: 'Poppins',
  },
  inputValue: {
    color: '#17281A',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  inputPlaceholder: {
    color: '#8AA091',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  pickerWrap: {
    marginTop: 8,
    borderColor: '#D9EBDE',
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickerDoneText: {
    color: '#207B3E',
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  resultsCard: {
    borderWidth: 1,
    borderColor: '#D7E8DB',
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  resultRow: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#EDF4EF',
  },
  resultRowActive: {
    backgroundColor: '#EAF8EE',
  },
  resultText: {
    color: '#18311E',
    fontSize: 15,
    fontFamily: 'Poppins',
  },
  resultTextActive: {
    color: '#0F6D34',
    fontWeight: '700',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    minWidth: '30%',
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#CFE2D4',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipSelected: {
    borderColor: '#2A8B4A',
    backgroundColor: '#EAF7EE',
  },
  timeChipDisabled: {
    opacity: 0.55,
  },
  timeChipText: {
    color: '#213D28',
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  timeChipTextSelected: {
    color: '#116F35',
  },
  timeChipBadge: {
    marginTop: 2,
    color: '#AA2341',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins',
    lineHeight: 16,
  },
  timeChipBadgeHidden: {
    color: 'transparent',
  },
  timeChipBadgeFull: {
    color: '#C9304F',
  },
  timeChipBadgePast: {
    color: '#8A6A14',
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
  success: {
    marginTop: 10,
    color: '#1B8743',
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  error: {
    marginTop: 8,
    color: '#C9304F',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
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
  capacityText: {
    color: '#13703A',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: '#1F8E46',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#EFFFF2',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  emptyText: {
    color: '#5A7E5D',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Poppins',
  },
  activeBookingsCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#CEE8D4',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  activeBookingsTitle: {
    color: '#1D3D20',
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  activeBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  activeBookingBody: {
    flex: 1,
  },
  activeBookingTime: {
    color: '#143319',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  activeBookingGym: {
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
  statusBadgeBooked: {
    color: '#0F6D34',
    backgroundColor: '#EAF7EE',
  },
  statusBadgeCheckedIn: {
    color: '#0E4F7A',
    backgroundColor: '#E7F3FF',
  },
  bottomStack: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 20 : 12,
    paddingBottom: Platform.OS === 'ios' ? 4 : 0,
    backgroundColor: '#F6FAF7',
  },
});
