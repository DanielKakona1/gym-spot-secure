import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface SearchSelectInputProps<T extends { id: string }> {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  showResults: boolean;
  isLoading: boolean;
  options: T[];
  selectedOptionId: string;
  getOptionLabel: (option: T) => string;
  onSelectOption: (option: T) => void;
  emptyText?: string;
}

export function SearchSelectInput<T extends { id: string }>({
  label,
  value,
  placeholder,
  onChangeText,
  onFocus,
  showResults,
  isLoading,
  options,
  selectedOptionId,
  getOptionLabel,
  onSelectOption,
  emptyText = 'No matching results.',
}: SearchSelectInputProps<T>) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor="#8AA091"
        style={styles.input}
      />

      {showResults && (
        <View style={styles.resultsCard}>
          {isLoading && <ActivityIndicator color="#1F8E46" style={styles.state} />}
          {!isLoading && options.length === 0 && <Text style={styles.emptyText}>{emptyText}</Text>}
          {!isLoading &&
            options.map((option) => {
              const active = option.id === selectedOptionId;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.resultRow, active && styles.resultRowActive]}
                  onPress={() => onSelectOption(option)}
                >
                  <Text style={[styles.resultText, active && styles.resultTextActive]}>{getOptionLabel(option)}</Text>
                </Pressable>
              );
            })}
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
    color: '#17281A',
    fontSize: 16,
    justifyContent: 'center',
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
  state: {
    marginTop: 10,
  },
  emptyText: {
    color: '#5A7E5D',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Poppins',
  },
});
