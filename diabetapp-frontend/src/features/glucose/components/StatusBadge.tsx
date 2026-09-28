import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/src/shared/components/ui';
import type { AppIconName } from '@/src/shared/components/ui';
import { color, radius, space, type } from '@/src/shared/theme/tokens';
import { RangeStatus } from '../rangeStatus';

/**
 * Estado de una lectura respecto al rango del paciente (spec fase 15, RF-15.10): siempre
 * **icono + texto + color**, nunca solo color. Con `unknown` no muestra nada.
 */
const TONES: Record<
  Exclude<RangeStatus, 'unknown'>,
  { label: string; icon: AppIconName; fg: string; bg: string }
> = {
  in_range: { label: 'En rango', icon: 'check-circle', fg: color.success, bg: color.successBg },
  high: { label: 'Alto', icon: 'trend-up', fg: color.danger, bg: color.dangerBg },
  low: { label: 'Bajo', icon: 'trend-down', fg: color.warning, bg: color.warningBg },
};

export const rangeStatusLabel = (status: RangeStatus): string =>
  status === 'unknown' ? '' : TONES[status].label;

const StatusBadge = ({ status }: { status: RangeStatus }) => {
  if (status === 'unknown') return null;

  const { label, icon, fg, bg } = TONES[status];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Icon name={icon} size={16} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    columnGap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  text: { fontSize: type.caption.fontSize, lineHeight: type.caption.lineHeight, fontWeight: '700' },
});

export default StatusBadge;
