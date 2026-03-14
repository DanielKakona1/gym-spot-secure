import type { Booking } from '@gym-spot/shared-types';
import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useCapacity } from './useCapacity';
import { gymService } from '../services/gymService';

interface TimeOption {
  key: string;
  label: string;
}

interface UseBookingSlotStateParams {
  selectedGymId: string;
  selectedUserId: string;
  selectedDate: Date | null;
  selectedTimeKey: string;
  userBookings?: Booking[];
  timeOptions: readonly TimeOption[];
}

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

function isTimeSlotInPast(selectedDate: Date | null, timeKey: string): boolean {
  if (!selectedDate) {
    return false;
  }
  const [hours, minutes] = timeKey.split(':').map(Number);
  const slot = new Date(selectedDate);
  slot.setHours(hours, minutes, 0, 0);
  return slot.getTime() < Date.now();
}

export function useBookingSlotState({
  selectedGymId,
  selectedUserId,
  selectedDate,
  selectedTimeKey,
  userBookings,
  timeOptions,
}: UseBookingSlotStateParams) {
  const selectedDateKey = useMemo(() => (selectedDate ? toDateKey(selectedDate) : ''), [selectedDate]);

  const bookedTimeKeysForDate = useMemo(() => {
    const bookings = userBookings ?? [];
    return new Set(
      bookings
        .filter((booking) => booking.gymId === selectedGymId && toDateKey(new Date(booking.slotTime)) === selectedDateKey)
        .map((booking) => {
          const slotDate = new Date(booking.slotTime);
          const hh = String(slotDate.getHours()).padStart(2, '0');
          const mm = String(slotDate.getMinutes()).padStart(2, '0');
          return `${hh}:${mm}`;
        }),
    );
  }, [selectedDateKey, selectedGymId, userBookings]);

  const selectedTimeIsBooked = bookedTimeKeysForDate.has(selectedTimeKey);
  const canSelectDateTime = selectedGymId.length > 0 && selectedUserId.length > 0;

  const hasActiveBookingForSelectedDay = useMemo(() => {
    if (!selectedDateKey) {
      return false;
    }
    return (userBookings ?? []).some((booking) => toDateKey(new Date(booking.slotTime)) === selectedDateKey);
  }, [selectedDateKey, userBookings]);

  const slotCapacityQueries = useQueries({
    queries: timeOptions.map((option) => ({
      queryKey: ['capacity-by-time', selectedGymId, selectedDateKey, option.key],
      queryFn: () => gymService.getCapacity(selectedGymId, toSlotIso(selectedDateKey, option.key)),
      enabled: selectedGymId.length > 0 && selectedDateKey.length > 0,
    })),
  });

  const fullTimeKeys = useMemo(() => {
    const keys = new Set<string>();
    slotCapacityQueries.forEach((query, index) => {
      if (query.data && query.data.currentBookings >= query.data.capacityLimit) {
        keys.add(timeOptions[index].key);
      }
    });
    return keys;
  }, [slotCapacityQueries, timeOptions]);

  const isTimeSlotPast = useCallback((timeKey: string) => isTimeSlotInPast(selectedDate, timeKey), [selectedDate]);

  const selectedTimeIsPast = isTimeSlotPast(selectedTimeKey);
  const selectedTimeIsFullFromSlots = fullTimeKeys.has(selectedTimeKey);
  const hasFullSlots = fullTimeKeys.size > 0;
  const allSlotsFullForGymBySlots = fullTimeKeys.size >= timeOptions.length;

  const capacityTimeKey =
    selectedTimeKey ||
    timeOptions.find((option) => !isTimeSlotPast(option.key) && !fullTimeKeys.has(option.key))?.key ||
    timeOptions[0]?.key ||
    '';

  const slotIso = selectedDateKey && selectedGymId && capacityTimeKey ? toSlotIso(selectedDateKey, capacityTimeKey) : '';

  const capacityQuery = useCapacity(selectedGymId, slotIso);

  const allSlotsFullForGymByCapacity = Boolean(
    capacityQuery.data && capacityQuery.data.currentBookings >= capacityQuery.data.capacityLimit,
  );
  const allSlotsFullForGym = allSlotsFullForGymBySlots || allSlotsFullForGymByCapacity;
  const selectedTimeIsFull = selectedTimeIsFullFromSlots || allSlotsFullForGym;

  return {
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
  };
}
