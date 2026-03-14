import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface DatePickerFieldProps {
  label?: string;
  selectedDate: Date | null;
  minimumDate: Date;
  canSelect: boolean;
  showPicker: boolean;
  displayValue: string;
  onTogglePicker: () => void;
  onChangeDate: (event: DateTimePickerEvent, value?: Date) => void;
  onDone?: () => void;
}

export function DatePickerField({
  label = 'Date',
  selectedDate,
  minimumDate,
  canSelect,
  showPicker,
  displayValue,
  onTogglePicker,
  onChangeDate,
  onDone,
}: DatePickerFieldProps) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.input, !canSelect && styles.inputDisabled]} onPress={onTogglePicker} disabled={!canSelect}>
        <Text style={styles.inputValue}>{displayValue}</Text>
      </Pressable>

      {showPicker && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={selectedDate ?? minimumDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={minimumDate}
            onChange={onChangeDate}
          />
          {Platform.OS === 'ios' && (
            <Pressable style={styles.pickerDone} onPress={onDone}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'center',
  },
  inputValue: {
    color: '#17281A',
    fontSize: 16,
    fontFamily: 'Poppins',
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
});
