import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { color, radius, space, touch, type } from '../../theme/tokens';
import Icon, { AppIconName } from './Icon';

/**
 * Filas táctiles de altura ≥ 56 (spec fase 15, D-15.7): `ListRow` navega o ejecuta una acción,
 * `SwitchRow` activa/desactiva un ajuste. Ambas anuncian su nombre, rol y estado.
 */
interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: AppIconName;
  onPress: () => void;
  /** Sin flecha derecha (p. ej. para una acción que no navega). */
  hideChevron?: boolean;
  destructive?: boolean;
}

export const ListRow = ({
  title,
  subtitle,
  icon,
  onPress,
  hideChevron = false,
  destructive = false,
}: ListRowProps) => {
  const tint = destructive ? color.danger : color.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {icon ? (
        <View style={styles.iconCircle}>
          <Icon name={icon} size={22} color={destructive ? color.danger : color.primary} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.title, { color: tint }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {hideChevron ? null : <Icon name="chevron-right" size={20} color={color.textMuted} />}
    </Pressable>
  );
};

interface SwitchRowProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const SwitchRow = ({
  title,
  description,
  value,
  onValueChange,
  disabled,
}: SwitchRowProps) => (
  <View style={styles.row}>
    <View style={styles.text}>
      <Text style={[styles.title, { color: color.text }]}>{title}</Text>
      {description ? <Text style={styles.subtitle}>{description}</Text> : null}
    </View>
    <Switch
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityState={{ checked: value, disabled }}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: color.borderStrong, true: color.primary }}
      thumbColor={color.surface}
    />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: space.md,
    minHeight: 56,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    backgroundColor: color.surface,
    borderRadius: radius.card,
  },
  pressed: { backgroundColor: color.primarySoft },
  iconCircle: {
    width: touch.compact,
    height: touch.compact,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primarySoft,
  },
  text: { flex: 1 },
  title: { fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, fontWeight: '600' },
  subtitle: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
  },
});
