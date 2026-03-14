import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

type NoticeVariant = 'hint' | 'error' | 'success';

interface InlineNoticeProps {
  children: string;
  variant?: NoticeVariant;
  testID?: string;
  style?: StyleProp<TextStyle>;
}

export function InlineNotice({
  children,
  variant = 'hint',
  testID,
  style,
}: InlineNoticeProps) {
  return (
    <Text
      testID={testID}
      style={[
        styles.base,
        variant === 'hint' ? styles.hint : variant === 'error' ? styles.error : styles.success,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Poppins',
  },
  hint: {
    marginTop: 8,
    color: '#486F4E',
    fontSize: 12,
  },
  error: {
    marginTop: 8,
    color: '#C9304F',
    fontSize: 12,
  },
  success: {
    marginTop: 10,
    color: '#1B8743',
    fontWeight: '700',
  },
});
