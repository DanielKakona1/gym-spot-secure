import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'danger' | 'outline';
type ButtonSize = 'md' | 'sm';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}: AppButtonProps) {
  return (
    <Pressable
      style={[
        styles.base,
        size === 'md' ? styles.sizeMd : styles.sizeSm,
        variant === 'primary' ? styles.primary : variant === 'danger' ? styles.danger : styles.outline,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.textBase,
          size === 'md' ? styles.textMd : styles.textSm,
          variant === 'outline' ? styles.textOutline : styles.textFilled,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  sizeMd: {
    height: 54,
    borderRadius: 14,
  },
  sizeSm: {
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primary: {
    backgroundColor: '#1F8E46',
  },
  danger: {
    backgroundColor: '#C9304F',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#CEE8D4',
    backgroundColor: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  textMd: {
    fontSize: 17,
  },
  textSm: {
    fontSize: 12,
  },
  textFilled: {
    color: '#EFFFF2',
  },
  textOutline: {
    color: '#116F35',
  },
});
