import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, type } from '@/src/shared/theme/tokens';
import { MOMENT_OF_DAY_OPTIONS } from '../constants';
import { formatReadingTime } from '../history';
import { RangeStatus } from '../rangeStatus';
import { GlucoseReading } from '../types';
import StatusBadge, { rangeStatusLabel } from './StatusBadge';

const MOMENT_LABEL = Object.fromEntries(MOMENT_OF_DAY_OPTIONS.map((o) => [o.value, o.label]));

interface GlucoseRowProps {
  reading: GlucoseReading;
  status: RangeStatus;
  onPress: () => void;
}

/** Una medición del historial (spec fase 15, RF-15.5): valor, hora, momento y estado. ≥ 64 dp. */
const GlucoseRow = ({ reading, status, onPress }: GlucoseRowProps) => {
  const time = formatReadingTime(reading.timestamp);
  const moment = MOMENT_LABEL[reading.momentOfDay];
  const statusText = rangeStatusLabel(status);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${reading.value} mg/dL, ${time}, ${moment}${statusText ? `, ${statusText}` : ''}. Toca para editar`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.value}>
        <Text style={styles.number}>{reading.value}</Text>
        <Text style={styles.unit}>mg/dL</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.moment}>{moment}</Text>
        {reading.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {reading.notes}
          </Text>
        ) : null}
      </View>

      <StatusBadge status={status} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: space.md,
    minHeight: 64,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.card,
    marginBottom: space.sm,
  },
  pressed: { backgroundColor: color.primarySoft },
  value: { minWidth: 64, alignItems: 'flex-start' },
  number: {
    fontSize: type.heading.fontSize + 4,
    lineHeight: type.heading.lineHeight + 4,
    fontWeight: '700',
    color: color.text,
  },
  unit: { fontSize: type.caption.fontSize, color: color.textMuted },
  info: { flex: 1 },
  time: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  moment: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
  },
  notes: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
    fontStyle: 'italic',
  },
});

export default GlucoseRow;
