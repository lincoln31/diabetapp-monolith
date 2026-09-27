import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, ErrorView, Icon, LoadingView, Screen } from '@/src/shared/components/ui';
import ProgressBar from '@/src/shared/components/ui/ProgressBar';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { color, radius, space, touch, type } from '@/src/shared/theme/tokens';
import { useAchievements } from '../hooks/useAchievements';
import { Achievement, AchievementMetric } from '../types';

const METRIC_ICON: Record<AchievementMetric, 'flame' | 'chart'> = {
  streak: 'flame',
  readingsCount: 'chart',
};

const METRIC_UNIT: Record<AchievementMetric, string> = {
  streak: 'días seguidos',
  readingsCount: 'lecturas',
};

const AchievementRow = ({ achievement }: { achievement: Achievement }) => {
  const { name, description, metric, threshold, currentValue, unlocked } = achievement;

  return (
    <Card padding="large" style={[styles.row, !unlocked && styles.rowLocked]}>
      <View
        style={[styles.iconCircle, unlocked ? styles.iconCircleUnlocked : styles.iconCircleLocked]}
      >
        <Icon
          name={unlocked ? 'check-circle' : METRIC_ICON[metric]}
          size={26}
          color={unlocked ? color.success : color.textMuted}
        />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
        {unlocked ? (
          <Text style={styles.unlocked}>Desbloqueado</Text>
        ) : (
          <View style={styles.progress}>
            <Text style={styles.locked}>
              {currentValue} de {threshold} {METRIC_UNIT[metric]}
            </Text>
            <ProgressBar
              value={currentValue}
              max={threshold}
              label={`${currentValue} de ${threshold} ${METRIC_UNIT[metric]}`}
            />
          </View>
        )}
      </View>
    </Card>
  );
};

/** Pantalla «Mis Logros» (spec fase 9, RF-9.6 – RF-9.9). */
const AchievementsScreen = () => {
  const { status, achievements, errorMessage, offline, reload } = useAchievements();

  return (
    <Screen
      header={<ScreenHeader title="Mis logros" safeTop={false} />}
      contentStyle={styles.content}
    >
      {status === 'loading' ? <LoadingView /> : null}

      {status === 'error' ? (
        <ErrorView message={errorMessage ?? ''} offline={offline} onRetry={reload} />
      ) : null}

      {status === 'success' && achievements
        ? achievements.map((achievement) => (
            <AchievementRow key={achievement.code} achievement={achievement} />
          ))
        : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', columnGap: space.md },
  rowLocked: { backgroundColor: color.bg },
  iconCircle: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleUnlocked: { backgroundColor: color.successBg },
  iconCircleLocked: { backgroundColor: color.border },
  rowText: { flex: 1, rowGap: space.xs },
  name: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  description: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
  },
  unlocked: { fontSize: type.label.fontSize, fontWeight: '700', color: color.success },
  progress: { rowGap: space.xs },
  locked: { fontSize: type.label.fontSize, fontWeight: '600', color: color.textMuted },
});

export default AchievementsScreen;
