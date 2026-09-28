import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, touch, type } from '../../theme/tokens';
import Icon from './Icon';

/**
 * Selección única con todas las opciones visibles (spec fase 15, D-15.7): un toque en lugar de
 * abrir un `Picker`. La opción elegida lleva marca de verificación además de color.
 */
interface ChipsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

const Chips = <T extends string>({ options, value, onChange, label }: ChipsProps<T>) => (
  <View accessibilityRole="radiogroup" accessibilityLabel={label}>
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            hitSlop={touch.hitSlop}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              selected ? styles.selected : styles.unselected,
              pressed && styles.pressed,
            ]}
          >
            {selected ? <Icon name="check" size={16} color={color.onPrimary} /> : null}
            {/* `numberOfLines={1}` (spec fase 15, hallazgo de verificación en dispositivo): sin
                él, el chip que abre una fila nueva del `flexWrap` puede medir mal su ancho
                disponible y recortar una etiqueta larga a la mitad sin avisar (p. ej. «Antes
                del almuerzo» quedaba en «Antes del»). Con una sola línea fija, un chip que no
                cabe pasa entero a la siguiente fila en vez de partir su propio texto. */}
            <Text
              style={[styles.text, { color: selected ? color.onPrimary : color.text }]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: space.xs,
    minHeight: touch.compact,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  selected: { backgroundColor: color.primary, borderColor: color.primary },
  unselected: { backgroundColor: color.surface, borderColor: color.borderStrong },
  pressed: { opacity: 0.85 },
  text: { fontSize: type.label.fontSize, lineHeight: type.label.lineHeight, fontWeight: '600' },
});

export default Chips;
