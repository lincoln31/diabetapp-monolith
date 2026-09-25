import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIconName, Card, Icon } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import { GlucoseStats, PeriodStats, Trend } from '../types';

/** Tarjeta de promedios del dashboard (spec fase 5, RF-5.8 – RF-5.10, D-5.5). */

const TREND_META: Record<Trend, { label: string; icon: AppIconName; color: string }> = {
  improving: { label: 'Mejorando', icon: 'trend-down', color: COLORS.success },
  worsening: { label: 'Empeorando', icon: 'trend-up', color: COLORS.error },
  stable: { label: 'Estable', icon: 'trend-flat', color: COLORS.gray[500] },
  no_data: { label: 'Sin datos suficientes', icon: 'trend-flat', color: COLORS.gray[400] },
};

const isInRange = (average: number | null, target: GlucoseStats['target']): boolean | null => {
  if (average === null || target.min === null || target.max === null) {
    return null;
  }

  return average >= target.min && average <= target.max;
};

interface SecondaryPeriodProps {
  period: PeriodStats;
  label: string;
}

const SecondaryPeriod = ({ period, label }: SecondaryPeriodProps) => {
  const trend = TREND_META[period.trend];

  return (
    <View style={styles.secondaryRow}>
      <View>
        <Text style={styles.secondaryLabel}>{label}</Text>
        <Text style={styles.secondaryValue}>
          {period.average !== null ? `${period.average} mg/dL` : 'Sin lecturas'}
        </Text>
      </View>

      <View style={styles.trendBadge}>
        <Icon name={trend.icon} size={18} color={trend.color} />
        <Text style={[styles.trendLabel, { color: trend.color }]}>{trend.label}</Text>
      </View>
    </View>
  );
};

interface GlucoseAveragesCardProps {
  stats: GlucoseStats;
}

const GlucoseAveragesCard = ({ stats }: GlucoseAveragesCardProps) => {
  const headline = stats.periods['7'];
  const inRange = isInRange(headline.average, stats.target);

  return (
    <Card padding="large" style={styles.card}>
      <Text style={styles.title}>Promedio de 7 días</Text>

      <View style={styles.headlineRow}>
        <Text style={styles.headlineValue}>
          {headline.average !== null ? headline.average : '—'}
          <Text style={styles.headlineUnit}> mg/dL</Text>
        </Text>

        {inRange !== null && (
          <View style={[styles.rangeBadge, inRange ? styles.rangeBadgeIn : styles.rangeBadgeOut]}>
            <Text
              style={[styles.rangeBadgeText, inRange ? styles.rangeTextIn : styles.rangeTextOut]}
            >
              {inRange ? 'Dentro del rango' : 'Fuera del rango'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <SecondaryPeriod period={stats.periods['14']} label="14 días" />
      <SecondaryPeriod period={stats.periods['30']} label="30 días" />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  headlineValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  headlineUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  rangeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rangeBadgeIn: {
    backgroundColor: COLORS.green[50],
  },
  rangeBadgeOut: {
    backgroundColor: '#FEE2E2',
  },
  rangeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rangeTextIn: {
    color: COLORS.green[700],
  },
  rangeTextOut: {
    color: COLORS.error,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginVertical: 16,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  secondaryLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  secondaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  trendLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default GlucoseAveragesCard;
