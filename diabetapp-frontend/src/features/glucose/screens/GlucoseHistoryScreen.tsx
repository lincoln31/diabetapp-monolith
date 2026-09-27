import React, { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Card,
  Chips,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
} from '@/src/shared/components/ui';
import { color, gutter, space, type } from '@/src/shared/theme/tokens';
import { useProfile } from '@/src/features/profile';
import GlucoseChart from '../components/GlucoseChart';
import GlucoseRow from '../components/GlucoseRow';
import { groupByDay, summarizeReadings } from '../history';
import { useGlucoseHistory } from '../hooks/useGlucoseHistory';
import { MIN_POINTS_FOR_CHART } from '../chart';
import { getRangeStatus } from '../rangeStatus';

const PERIODS = [
  { value: '7', label: '7 días' },
  { value: '30', label: '30 días' },
] as const;

const Stat = ({ label, value }: { label: string; value: number | null }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value ?? '—'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/**
 * Historial de glucosa (spec fase 15, RF-15.5 – RF-15.7, A1): período, resumen, tendencia y
 * lista por día. Cada medición se toca para editarla o borrarla.
 */
const GlucoseHistoryScreen = () => {
  const router = useRouter();
  const [period, setPeriod] = useState<'7' | '30'>('7');
  const history = useGlucoseHistory(Number(period));
  const { profile } = useProfile();

  const target = useMemo(
    () => ({ min: profile?.targetGlucoseMin ?? null, max: profile?.targetGlucoseMax ?? null }),
    [profile?.targetGlucoseMin, profile?.targetGlucoseMax],
  );
  const sections = useMemo(() => groupByDay(history.readings), [history.readings]);
  const summary = useMemo(() => summarizeReadings(history.readings), [history.readings]);

  const goToRegister = () => router.push('/glucose/new');

  const header = (
    <View>
      <Text style={styles.title} accessibilityRole="header">
        Glucosa
      </Text>

      <Chips
        label="Período"
        options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        value={period}
        onChange={setPeriod}
      />

      {history.status === 'success' && summary.count > 0 ? (
        <Card padding="large" style={styles.summary}>
          <View style={styles.stats}>
            <Stat label="Promedio" value={summary.average} />
            <Stat label="Mínimo" value={summary.min} />
            <Stat label="Máximo" value={summary.max} />
          </View>
          <Text style={styles.count}>
            {summary.count} {summary.count === 1 ? 'medición' : 'mediciones'} en los últimos{' '}
            {period} días · mg/dL
            {history.total > history.readings.length
              ? ` · mostrando las últimas ${history.readings.length}`
              : ''}
          </Text>
          {summary.count >= MIN_POINTS_FOR_CHART ? (
            <GlucoseChart readings={history.readings} target={target} />
          ) : null}
        </Card>
      ) : null}
    </View>
  );

  const empty =
    history.status === 'loading' ? (
      <LoadingView />
    ) : history.status === 'error' ? (
      <ErrorView
        message={history.errorMessage ?? ''}
        offline={history.offline}
        onRetry={history.retry}
      />
    ) : (
      <EmptyView
        icon="drop"
        title="Aún no hay mediciones en este período"
        message="Registra tu glucosa para ver aquí tu historial y tu tendencia."
      />
    );

  return (
    <Screen
      scroll={false}
      insetBottom={false}
      contentStyle={styles.screen}
      footer={<Button title="Registrar glucosa" icon="plus" size="large" onPress={goToRegister} />}
    >
      <SectionList
        sections={sections}
        keyExtractor={(reading) => reading.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        refreshControl={
          <RefreshControl refreshing={history.refreshing} onRefresh={history.refresh} />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <GlucoseRow
            reading={item}
            status={getRangeStatus(item.value, target.min, target.max)}
            onPress={() => router.push({ pathname: '/glucose/[id]', params: { id: item.id } })}
          />
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: { padding: 0 },
  list: { padding: gutter, paddingBottom: space.xl },
  title: {
    fontSize: type.title.fontSize,
    lineHeight: type.title.lineHeight,
    fontWeight: '700',
    color: color.text,
    marginBottom: space.md,
  },
  summary: { marginTop: space.lg },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statValue: {
    fontSize: type.display.fontSize,
    lineHeight: type.display.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  statLabel: { fontSize: type.label.fontSize, color: color.textMuted },
  count: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
    marginTop: space.md,
  },
  sectionTitle: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '600',
    color: color.text,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
});

export default GlucoseHistoryScreen;
