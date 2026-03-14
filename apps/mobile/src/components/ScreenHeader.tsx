import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  onActionPress: () => void;
  titleSize?: number;
}

export function ScreenHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  titleSize = 34,
}: ScreenHeaderProps) {
  return (
    <>
      <View style={styles.row}>
        <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
        <AppButton label={actionLabel} onPress={onActionPress} variant="outline" size="sm" />
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    color: '#132416',
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
});
