import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { color, radius, space, touch, type } from '../../theme/tokens';
import Icon, { AppIconName } from './Icon';

/**
 * Botón único de la app (spec fase 15, D-15.7).
 *
 * - `primary`: la acción principal de la pantalla (una sola).
 * - `secondary`: acción importante pero no principal (`outline` es un alias antiguo).
 * - `tertiary`: acción auxiliar, solo texto.
 * - `destructive`: borrar/descartar; siempre con confirmación y lejos de la acción principal.
 *
 * Alto mínimo táctil de 48 dp; `small` mide 40 y añade `hitSlop` para llegar a 48.
 */
type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline';
type Size = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  icon?: AppIconName;
  /** `danger` tiñe los botones `secondary`/`tertiary` de rojo (acciones destructivas discretas). */
  tone?: 'default' | 'danger';
  style?: StyleProp<ViewStyle>;
}

const MIN_HEIGHT: Record<Size, number> = {
  small: touch.compact,
  medium: touch.min,
  large: 56,
};

const Button = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  loadingText,
  icon,
  tone = 'default',
  style,
  disabled,
  accessibilityLabel,
  ...props
}: ButtonProps) => {
  const kind = variant === 'outline' ? 'secondary' : variant;
  const inactive = Boolean(disabled) || loading;
  const danger = tone === 'danger' && (kind === 'secondary' || kind === 'tertiary');
  const textColor = inactive ? color.disabledText : danger ? color.danger : TEXT_COLOR[kind];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={size === 'small' ? touch.hitSlop : undefined}
      style={({ pressed }) => [
        styles.base,
        { minHeight: MIN_HEIGHT[size] },
        inactive ? styles.disabled : VARIANT_STYLE[kind],
        danger && !inactive && kind === 'secondary' && styles.dangerBorder,
        pressed && !inactive && styles.pressed,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={textColor} />
          {loadingText ? (
            <Text style={[styles.text, { color: textColor }]}>{loadingText}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={20} color={textColor} /> : null}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const TEXT_COLOR = {
  primary: color.onPrimary,
  secondary: color.primary,
  tertiary: color.primary,
  destructive: color.onPrimary,
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: space.sm,
  },
  text: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: { opacity: 0.85 },
  primary: { backgroundColor: color.primary },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: color.primary,
  },
  tertiary: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: color.danger },
  disabled: { backgroundColor: color.disabledBg },
  dangerBorder: { borderColor: color.danger },
});

const VARIANT_STYLE = {
  primary: styles.primary,
  secondary: styles.secondary,
  tertiary: styles.tertiary,
  destructive: styles.destructive,
} as const;

export default Button;
