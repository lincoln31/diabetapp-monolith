import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { color, radius, space, touch, type } from '../../theme/tokens';
import Icon, { AppIconName } from './Icon';

/**
 * Campo de texto (spec fase 15, D-15.7): etiqueta **encima** (no solo placeholder), ayuda,
 * error junto al campo con icono + texto, y borde de control ≥ 3 : 1.
 */
interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  icon?: AppIconName;
  rightIcon?: AppIconName;
  /** Nombre accesible del botón derecho (p. ej. «Mostrar contraseña»). */
  rightIconLabel?: string;
  onRightIconPress?: () => void;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const Input = ({
  label,
  helper,
  icon,
  rightIcon,
  rightIconLabel,
  onRightIconPress,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...props
}: InputProps) => {
  const [focused, setFocused] = useState(false);

  const handleFocus = (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.wrapper, focused && styles.focused, error ? styles.errored : null]}>
        {icon ? (
          <Icon
            name={icon}
            size={20}
            color={focused ? color.primary : color.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={color.borderStrong}
          accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={touch.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={rightIconLabel}
            style={styles.rightIcon}
          >
            <Icon name={rightIcon} size={22} color={color.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.messageRow} accessibilityLiveRegion="polite">
          <Icon name="alert" size={16} color={color.danger} />
          <Text style={[styles.message, styles.errorText]}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={[styles.message, styles.helperText]}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: space.lg },
  label: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
    marginBottom: space.xs,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderWidth: 1.5,
    borderColor: color.borderStrong,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    minHeight: 52,
  },
  focused: { borderWidth: 2, borderColor: color.primary },
  errored: { borderWidth: 2, borderColor: color.danger },
  leftIcon: { marginRight: space.sm },
  input: {
    flex: 1,
    fontSize: type.body.fontSize,
    color: color.text,
    paddingVertical: space.md,
  },
  rightIcon: { padding: space.xs, marginLeft: space.sm },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: space.xs,
    marginTop: space.xs,
  },
  message: {
    flexShrink: 1,
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    marginTop: 0,
  },
  errorText: { color: color.danger, fontWeight: '600' },
  helperText: { color: color.textMuted, marginTop: space.xs },
});

export default Input;
