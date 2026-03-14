import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SectionLabel } from './SectionLabel';

interface TimeOption {
  key: string;
  label: string;
}

interface TimeSlotGridProps {
  label?: string;
  options: readonly TimeOption[];
  selectedTimeKey: string;
  canSelectDateTime: boolean;
  isTimeSlotPast: (timeKey: string) => boolean;
  isTimeSlotFull: (timeKey: string) => boolean;
  isTimeSlotBooked: (timeKey: string) => boolean;
  onSelectTime: (timeKey: string) => void;
}

export function TimeSlotGrid({
  label = 'Time',
  options,
  selectedTimeKey,
  canSelectDateTime,
  isTimeSlotPast,
  isTimeSlotFull,
  isTimeSlotBooked,
  onSelectTime,
}: TimeSlotGridProps) {
  return (
    <>
      <SectionLabel label={label} />
      <View style={styles.timeGrid}>
        {options.map((option) => {
          const isBooked = isTimeSlotBooked(option.key);
          const isPast = isTimeSlotPast(option.key);
          const isFull = isTimeSlotFull(option.key);
          const isSelected = option.key === selectedTimeKey;

          return (
            <Pressable
              key={option.key}
              style={[styles.timeChip, isSelected && styles.timeChipSelected, (!canSelectDateTime || isPast || isFull) && styles.timeChipDisabled]}
              onPress={() => onSelectTime(option.key)}
              disabled={!canSelectDateTime || isPast || isFull}
            >
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
    </>
  );
}

const styles = StyleSheet.create({
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
});
