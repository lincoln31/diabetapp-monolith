import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Icon } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import { StreakStats } from '../types';

/** Tarjeta de racha y meta diaria (spec fase 8, RF-8.9 – RF-8.11). */

const days = (count: number): string => `${count} ${count === 1 ? 'día' : 'días'}`;

interface StreakCardProps {
  streak: StreakStats;
}

const StreakCard = ({ streak }: StreakCardProps) => {
  const { current, longest, todayCount, dailyGoal, goalReachedToday } = streak;
  const active = current > 0;

  return (
    <Card padding="large" style={styles.card}>
      <Text style={styles.title}>Tu racha</Text>

      {active ? (
        <View style={styles.headlineRow}>
          <Icon name="flame" size={32} color={COLORS.warning} />
          <Text style={styles.headlineValue}>
            {days(current)} {current === 1 ? 'seguido' : 'seguidos'}
          </Text>
        </View>
      ) : (
        <Text style={styles.invitation}>Registra una glucosa hoy para iniciar tu racha</Text>
      )}

      {longest > 0 && <Text style={styles.best}>Tu mejor racha: {days(longest)}</Text>}

      <View style={styles.divider} />

      <View style={styles.todayRow}>
        <Text style={styles.today}>
          Hoy: {todayCount} de {dailyGoal} {dailyGoal === 1 ? 'lectura' : 'lecturas'}
        </Text>

        {goalReachedToday && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Meta de hoy cumplida</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.gray[500], marginBottom: 8 },
  headlineRow: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  headlineValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.gray[900] },
  invitation: { fontSize: 16, fontWeight: '600', color: COLORS.gray[700], lineHeight: 22 },
  best: { fontSize: 13, color: COLORS.gray[500], marginTop: 6 },
  divider: { height: 1, backgroundColor: COLORS.gray[100], marginVertical: 14 },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  today: { fontSize: 15, fontWeight: '600', color: COLORS.gray[800] },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.green[50],
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: COLORS.green[700] },
});

export default StreakCard;
