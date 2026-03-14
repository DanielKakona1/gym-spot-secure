import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { Gym, User } from '@gym-spot/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { BookingActiveBookingsCard } from '../components/BookingActiveBookingsCard';
import { DatePickerField } from '../components/DatePickerField';
import { LiveCapacityCard } from '../components/LiveCapacityCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchSelectInput } from '../components/SearchSelectInput';
import { TimeSlotGrid } from '../components/TimeSlotGrid';
import { useBookingSlotState } from '../hooks/useBookingSlotState';
import { useBookSlot } from '../hooks/useBookSlot';
import { useBookingSubmission } from '../hooks/useBookingSubmission';
import { useGyms } from '../hooks/useGyms';
import { useSearchSelect } from '../hooks/useSearchSelect';
import { useUserBookings } from '../hooks/useUserBookings';
import { useUsers } from '../hooks/useUsers';

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

function startOfToday(): Date {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

interface Props {
  onGoToAdmin: () => void;
}

export function BookingScreen({ onGoToAdmin }: Props) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(startOfToday());
  const [selectedTimeKey, setSelectedTimeKey] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const minimumDate = useMemo(() => startOfToday(), []);

  const gymsQuery = useGyms();
  const usersQuery = useUsers();
  const gymSelect = useSearchSelect<Gym>({
    options: gymsQuery.data ?? [],
    getOptionLabel: toGymLabel,
    onClear: () => {
      setSelectedTimeKey('');
    },
  });
  const userSelect = useSearchSelect<User>({
    options: usersQuery.data ?? [],
    getOptionLabel: (user) => user.name,
    onClear: () => {
      setSelectedTimeKey('');
    },
  });
  const selectedGymId = gymSelect.selectedId;
  const selectedUserId = userSelect.selectedId;
  const userBookingsQuery = useUserBookings(selectedUserId);
  const {
    selectedDateKey,
    bookedTimeKeysForDate,
    selectedTimeIsBooked,
    canSelectDateTime,
    hasActiveBookingForSelectedDay,
    fullTimeKeys,
    hasFullSlots,
    allSlotsFullForGym,
    selectedTimeIsPast,
    selectedTimeIsFull,
    isTimeSlotPast,
    capacityQuery,
  } = useBookingSlotState({
    selectedGymId,
    selectedUserId,
    selectedDate,
    selectedTimeKey,
    userBookings: userBookingsQuery.data,
    timeOptions: TIME_OPTIONS,
  });
  const bookMutation = useBookSlot(selectedGymId);
  const { submitDisabled, handleSubmit } = useBookingSubmission({
    selectedGymId,
    selectedUserId,
    selectedDate,
    selectedDateKey,
    selectedTimeKey,
    hasActiveBookingForSelectedDay,
    allSlotsFullForGym,
    selectedTimeIsBooked,
    selectedTimeIsPast,
    selectedTimeIsFull,
    isBookPending: bookMutation.isPending,
    canSelectDateTime,
    onSubmitBooking: (payload) => bookMutation.mutate(payload),
    toSlotIso,
  });
  const gymsById = useMemo(() => {
    const map = new Map<string, Gym>();
    (gymsQuery.data ?? []).forEach((gym) => map.set(gym.id, gym));
    return map;
  }, [gymsQuery.data]);

  useEffect(() => {
    if (!canSelectDateTime || !selectedDateKey) {
      setSelectedTimeKey('');
      return;
    }
    if (!selectedTimeKey) {
      return;
    }
    if (selectedTimeKey && !isTimeSlotPast(selectedTimeKey) && !fullTimeKeys.has(selectedTimeKey) && !allSlotsFullForGym) {
      return;
    }
    const firstAvailable = TIME_OPTIONS.find(
      (option) => !allSlotsFullForGym && !isTimeSlotPast(option.key) && !fullTimeKeys.has(option.key),
    );
    setSelectedTimeKey(firstAvailable?.key ?? '');
  }, [allSlotsFullForGym, canSelectDateTime, isTimeSlotPast, selectedDateKey, fullTimeKeys, selectedTimeKey]);

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

  const onSubmit = () => handleSubmit(setFormError);

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.overlay}>
          <ScreenHeader
            title="Spot Secure"
            subtitle="Book your training slot in seconds."
            actionLabel="Go to Admin"
            onActionPress={onGoToAdmin}
            titleSize={36}
          />

          <SearchSelectInput
            label="Gym"
            value={gymSelect.searchValue}
            onChangeText={gymSelect.onChangeText}
            onFocus={() => {
              gymSelect.onFocus();
              userSelect.setShowResults(false);
            }}
            placeholder={gymsQuery.isLoading ? 'Loading gyms...' : 'Search gym'}
            showResults={gymSelect.showResults}
            isLoading={gymsQuery.isLoading}
            options={gymSelect.filteredOptions}
            selectedOptionId={selectedGymId}
            getOptionLabel={toGymLabel}
            onSelectOption={(gym) => {
              gymSelect.onSelectOption(gym);
              setSelectedTimeKey('');
              setFormError(null);
              queryClient.invalidateQueries({ queryKey: ['capacity-by-time'] });
              queryClient.invalidateQueries({ queryKey: ['capacity'] });
            }}
            emptyText="No matching gyms."
          />

          <SearchSelectInput
            label="User"
            value={userSelect.searchValue}
            onChangeText={userSelect.onChangeText}
            onFocus={() => {
              userSelect.onFocus();
              gymSelect.setShowResults(false);
            }}
            placeholder={usersQuery.isLoading ? 'Loading users...' : 'Search user'}
            showResults={userSelect.showResults}
            isLoading={usersQuery.isLoading}
            options={userSelect.filteredOptions}
            selectedOptionId={selectedUserId}
            getOptionLabel={(user) => user.name}
            onSelectOption={(user) => {
              userSelect.onSelectOption(user);
              setSelectedTimeKey('');
              setFormError(null);
              queryClient.invalidateQueries({ queryKey: ['user-bookings', user.id] });
            }}
            emptyText="No matching users."
          />
          {selectedUserId.length > 0 && (userBookingsQuery.data?.length ?? 0) > 0 && (
            <BookingActiveBookingsCard
              bookings={userBookingsQuery.data ?? []}
              resolveGymLabel={(gymId) => (gymsById.has(gymId) ? toGymLabel(gymsById.get(gymId) as Gym) : gymId)}
              formatSlotTime={toBookingDateTimeLabel}
            />
          )}

          <DatePickerField
            selectedDate={selectedDate}
            minimumDate={minimumDate}
            canSelect={canSelectDateTime}
            showPicker={showDatePicker}
            displayValue={selectedDate ? toDateLabel(selectedDate) : 'Select date'}
            onTogglePicker={() => setShowDatePicker((prev) => !prev)}
            onChangeDate={onChangeDate}
            onDone={() => setShowDatePicker(false)}
          />

          <Text style={styles.label}>Time</Text>
          <TimeSlotGrid
            options={TIME_OPTIONS}
            selectedTimeKey={selectedTimeKey}
            canSelectDateTime={canSelectDateTime}
            isTimeSlotPast={isTimeSlotPast}
            isTimeSlotFull={(timeKey) => allSlotsFullForGym || fullTimeKeys.has(timeKey)}
            isTimeSlotBooked={(timeKey) => bookedTimeKeysForDate.has(timeKey)}
            onSelectTime={setSelectedTimeKey}
          />

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
        <LiveCapacityCard
          isLoading={capacityQuery.isLoading}
          data={
            capacityQuery.data
              ? {
                  currentBookings: capacityQuery.data.currentBookings,
                  capacityLimit: capacityQuery.data.capacityLimit,
                  fullnessPercentage: capacityQuery.data.fullnessPercentage,
                }
              : undefined
          }
          errorMessage={capacityQuery.isError ? capacityQuery.error.message : undefined}
        />
        <AppButton label="Book Slot" onPress={onSubmit} disabled={submitDisabled} style={styles.submitButton} />
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
  submitButton: {
    marginTop: 12,
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
