import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/shared/components/ui';
import { color, space, type } from '@/src/shared/theme/tokens';
import { formatWhen, getRangeStatus, StatusBadge } from '@/src/features/glucose';
import type { GlucoseReading } from '@/src/features/glucose';

interface LatestReadingCardProps {
  reading: GlucoseReading;
  target: { min: number | null; max: number | null };
}

/** Última medición con su estado respecto al rango (spec fase 15, RF-15.3, RF-15.10). */
const LatestReadingCard = ({ reading, target }: LatestReadingCardProps) => {
  const status = getRangeStatus(reading.value, target.min, target.max);
  const when = formatWhen(reading.timestamp);

  return (
    <Card
      padding="large"
      accessible
      accessibilityLabel={`Última medición: ${reading.value} miligramos por decilitro, ${when}`}
    >
      <Text style={styles.label}>Última medición</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{reading.value}</Text>
        <Text style={styles.unit}>mg/dL</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.when}>{when}</Text>
        <StatusBadge status={status} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: space.sm,
    marginTop: space.xs,
  },
  value: { ...type.hero, color: color.text },
  unit: { fontSize: type.body.fontSize, color: color.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  when: { fontSize: type.label.fontSize, color: color.text },
});

export default LatestReadingCard;
