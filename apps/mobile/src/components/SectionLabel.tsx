import { StyleSheet, Text } from 'react-native';

interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return <Text style={styles.label}>{label}</Text>;
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
});
