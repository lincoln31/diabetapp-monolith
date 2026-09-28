import React, { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { color, radius, space, touch, type } from '../../theme/tokens';
import Icon from './Icon';

/**
 * Casilla accesible (spec fase 15, D-15.7): la fila completa es el área táctil (≥ 48 dp),
 * anuncia su estado y la marca es un icono, no un carácter.
 */
interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: ReactNode;
  /** Nombre accesible cuando `label` no es texto plano (p. ej. contiene enlaces). */
  accessibilityLabel?: string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const Checkbox = ({
  checked,
  onPress,
  label,
  accessibilityLabel,
  labelStyle,
  containerStyle,
}: CheckboxProps) => (
  <Pressable
    accessibilityRole="checkbox"
    accessibilityLabel={accessibilityLabel ?? (typeof label === 'string' ? label : undefined)}
    accessibilityState={{ checked }}
    onPress={onPress}
    style={[styles.container, containerStyle]}
  >
    <View style={[styles.box, checked && styles.boxChecked]}>
      {checked ? <Icon name="check" size={18} color={color.onPrimary} /> : null}
    </View>

    {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: space.md,
    minHeight: touch.min,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.control / 2,
    borderWidth: 2,
    borderColor: color.borderStrong,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: color.primary, borderColor: color.primary },
  label: {
    flex: 1,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
    fontWeight: '400',
  },
});

export default Checkbox;
