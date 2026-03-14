import { useCallback, type Dispatch, type SetStateAction } from 'react';

interface UseBookingSubmissionParams {
  selectedGymId: string;
  selectedUserId: string;
  selectedDate: Date | null;
  selectedDateKey: string;
  selectedTimeKey: string;
  hasActiveBookingForSelectedDay: boolean;
  allSlotsFullForGym: boolean;
  selectedTimeIsBooked: boolean;
  selectedTimeIsPast: boolean;
  selectedTimeIsFull: boolean;
  isBookPending: boolean;
  canSelectDateTime: boolean;
  onSubmitBooking: (payload: { userId: string; slotTime: string }) => void;
  toSlotIso: (dateKey: string, timeKey: string) => string;
}

export function useBookingSubmission({
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
  isBookPending,
  canSelectDateTime,
  onSubmitBooking,
  toSlotIso,
}: UseBookingSubmissionParams) {
  const submitDisabled =
    isBookPending ||
    hasActiveBookingForSelectedDay ||
    selectedTimeIsBooked ||
    selectedTimeIsPast ||
    selectedTimeIsFull ||
    allSlotsFullForGym ||
    !selectedTimeKey ||
    !canSelectDateTime ||
    !selectedDate;

  const getSubmitError = useCallback((): string | null => {
    if (!selectedGymId || !selectedUserId || !selectedDateKey || !selectedTimeKey) {
      return 'Please select gym, user, date, and time.';
    }
    if (hasActiveBookingForSelectedDay) {
      return 'This user already has an active booking for this day.';
    }
    if (allSlotsFullForGym) {
      return 'This gym is fully booked for this date.';
    }
    if (selectedTimeIsBooked) {
      return 'This user already booked this exact slot. Choose another time.';
    }
    if (selectedTimeIsPast) {
      return 'This time slot has already passed.';
    }
    if (selectedTimeIsFull) {
      return 'This time slot is full.';
    }

    return null;
  }, [
    allSlotsFullForGym,
    hasActiveBookingForSelectedDay,
    selectedDateKey,
    selectedGymId,
    selectedTimeIsBooked,
    selectedTimeIsFull,
    selectedTimeIsPast,
    selectedTimeKey,
    selectedUserId,
  ]);

  const handleSubmit = useCallback(
    (setFormError: Dispatch<SetStateAction<string | null>>) => {
      const error = getSubmitError();
      if (error) {
        setFormError(error);
        return;
      }

      setFormError(null);
      onSubmitBooking({
        userId: selectedUserId,
        slotTime: toSlotIso(selectedDateKey, selectedTimeKey),
      });
    },
    [getSubmitError, onSubmitBooking, selectedDateKey, selectedTimeKey, selectedUserId, toSlotIso],
  );

  return {
    submitDisabled,
    handleSubmit,
  };
}
