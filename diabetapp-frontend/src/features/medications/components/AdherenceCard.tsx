import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/shared/components/ui';
import { color, space, type } from '@/src/shared/theme/tokens';
import { AdherencePeriod, AdherenceStats } from '../types';

const Period = ({ label, period }: { label: string; period: AdherencePeriod }) => (
  <View style={styles.period}>
    <Text style={styles.percent}>{period.percent === null ? '—' : `${period.percent} %`}</Text>
    <Text style={styles.label}>{label}</Text>
    {period.expected > 0 ? (
      <Text style={styles.detail}>
        {period.taken} de {period.expected} tomas
      </Text>
    ) : null}
  </View>
);

/** Adherencia a la medicación (spec fase 11, RF-11.12; ahora en la pestaña Medicación, fase 15). */
const AdherenceCard = ({ adherence }: { adherence: AdherenceStats }) => (
  <Card padding="large" style={styles.card}>
    <Text style={styles.title} accessibilityRole="header">
      Tu adherencia
    </Text>
    <View style={styles.row}>
      <Period label="Últimos 7 días" period={adherence.days7} />
      <Period label="Últimos 30 días" period={adherence.days30} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: { rowGap: space.md },
  title: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  row: { flexDirection: 'row', columnGap: space.lg },
  period: { flex: 1 },
  percent: { ...type.display, color: color.text },
  label: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
    fontWeight: '600',
  },
  detail: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
  },
});

export default AdherenceCard;
