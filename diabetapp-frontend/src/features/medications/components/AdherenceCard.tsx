import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import { AdherencePeriod, AdherenceStats } from '../types';

const Period = ({ label, period }: { label: string; period: AdherencePeriod }) => (
  <View style={styles.period}>
    <Text style={styles.percent}>{period.percent === null ? '—' : `${period.percent} %`}</Text>
    <Text style={styles.label}>{label}</Text>
    {period.expected > 0 && (
      <Text style={styles.detail}>
        {period.taken} de {period.expected} tomas
      </Text>
    )}
  </View>
);

/** Tarjeta de adherencia a la medicación (spec fase 11, RF-11.12). */
const AdherenceCard = ({ adherence }: { adherence: AdherenceStats }) => (
  <Card padding="large" style={styles.card}>
    <Text style={styles.title}>Adherencia a tu medicación</Text>
    <View style={styles.row}>
      <Period label="Últimos 7 días" period={adherence.days7} />
      <Period label="Últimos 30 días" period={adherence.days30} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.gray[500], marginBottom: 12 },
  row: { flexDirection: 'row', columnGap: 16 },
  period: { flex: 1 },
  percent: { fontSize: 28, fontWeight: 'bold', color: COLORS.gray[900] },
  label: { fontSize: 13, color: COLORS.gray[600], marginTop: 2 },
  detail: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
});

export default AdherenceCard;
