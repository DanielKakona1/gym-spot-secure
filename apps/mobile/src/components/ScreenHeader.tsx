import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Pressable style={styles.actionButton} onPress={onActionPress}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
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
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CEE8D4',
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    color: '#116F35',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
