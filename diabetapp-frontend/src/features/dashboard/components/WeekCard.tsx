import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/src/shared/components/ui';
import type { AppIconName } from '@/src/shared/components/ui';
import { color, space, type } from '@/src/shared/theme/tokens';
import { Hba1cProjection, PeriodStats, StreakStats, Trend } from '../types';

const TREND: Record<Exclude<Trend, 'no_data'>, { label: string; icon: AppIconName; fg: string }> = {
  improving: { label: 'Mejorando', icon: 'trend-down', fg: color.success },
  worsening: { label: 'Empeorando', icon: 'trend-up', fg: color.danger },
  stable: { label: 'Estable', icon: 'trend-flat', fg: color.textMuted },
};

interface WeekCardProps {
  week: PeriodStats;
  streak: StreakStats | null;
  hba1c: Hba1cProjection | null;
  onSeeHistory: () => void;
}

const Stat = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    {children}
  </View>
);

/**
 * «Esta semana» (spec fase 15, RF-15.3): promedio de 7 días con su tendencia, racha y HbA1c
 * estimada en una sola tarjeta; el detalle vive en la pestaña Glucosa.
 */
const WeekCard = ({ week, streak, hba1c, onSeeHistory }: WeekCardProps) => {
  const trend = week.trend === 'no_data' ? null : TREND[week.trend];

  return (
    <Card padding="large" style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Esta semana
      </Text>

      <View style={styles.stats}>
        <Stat label="Promedio">
          <Text style={styles.value}>{week.average ?? '—'}</Text>
          <Text style={styles.unit}>mg/dL</Text>
          {trend ? (
            <View style={styles.trend}>
              <Icon name={trend.icon} size={16} color={trend.fg} />
              <Text style={[styles.trendText, { color: trend.fg }]}>{trend.label}</Text>
            </View>
          ) : null}
        </Stat>

        {streak && streak.current > 0 ? (
          <Stat label="Racha">
            <Text style={styles.value}>{streak.current}</Text>
            <Text style={styles.unit}>
              {streak.current === 1 ? 'día seguido' : 'días seguidos'}
            </Text>
          </Stat>
        ) : null}

        {hba1c?.sufficientData && hba1c.projectedHba1c !== null ? (
          <Stat label="HbA1c estimada">
            <Text style={styles.value}>{hba1c.projectedHba1c}</Text>
            <Text style={styles.unit}>%</Text>
          </Stat>
        ) : null}
      </View>

      <Button
        title="Ver historial"
        variant="tertiary"
        size="small"
        onPress={onSeeHistory}
        style={styles.link}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { rowGap: space.md },
  title: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  stats: { flexDirection: 'row', columnGap: space.lg },
  stat: { flex: 1 },
  statLabel: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: type.display.fontSize,
    lineHeight: type.display.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  unit: { fontSize: type.caption.fontSize, color: color.textMuted },
  trend: { flexDirection: 'row', alignItems: 'center', columnGap: space.xs, marginTop: space.xs },
  trendText: { fontSize: type.caption.fontSize, fontWeight: '700' },
  link: { alignSelf: 'flex-start' },
});

export default WeekCard;
