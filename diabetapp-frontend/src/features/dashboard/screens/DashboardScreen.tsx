import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, EmptyView, Screen, Skeleton } from '@/src/shared/components/ui';
import { color, space, type } from '@/src/shared/theme/tokens';
import { useSession } from '@/src/features/auth';
import { useExerciseSummary } from '@/src/features/exercise';
import { useNotificationSync } from '@/src/features/notifications';
import BlockError from '../components/BlockError';
import LatestReadingCard from '../components/LatestReadingCard';
import TodayCard from '../components/TodayCard';
import WeekCard from '../components/WeekCard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useHba1cProjection } from '../hooks/useHba1cProjection';
import { useLatestReading } from '../hooks/useLatestReading';
import { useStreak } from '../hooks/useStreak';
import { useTodayMedications } from '../hooks/useTodayMedications';

/**
 * «Hoy» (spec fase 15, RF-15.3): arriba la acción principal, después solo lo del día. La
 * navegación a lo demás vive en la barra de pestañas; los ajustes, en «Más».
 */
const DashboardScreen = () => {
  const { user } = useSession();
  const router = useRouter();
  const stats = useDashboardStats();
  const streak = useStreak();
  const hba1c = useHba1cProjection();
  const latest = useLatestReading();
  const meds = useTodayMedications();
  const exercise = useExerciseSummary();
  useNotificationSync();

  // Deslizar hacia abajo refresca todos los bloques (spec fase 5, RF-5.13)
  const refreshAll = () =>
    Promise.all([
      stats.refresh(),
      streak.refresh(),
      hba1c.refresh(),
      latest.refresh(),
      meds.refresh(),
      exercise.refresh(),
    ]);

  const target = {
    min: stats.stats?.target.min ?? null,
    max: stats.stats?.target.max ?? null,
  };
  const week = stats.stats?.periods['7'] ?? null;

  const todayLoading = streak.status === 'loading' && meds.status === 'loading';
  const todayFailed =
    streak.status === 'error' && meds.status === 'error' && exercise.status === 'error';

  return (
    <Screen
      insetBottom={false}
      refreshing={stats.refreshing}
      onRefresh={refreshAll}
      contentStyle={styles.content}
    >
      <Text style={styles.greeting} accessibilityRole="header">
        {user?.firstName ? `Hola, ${user.firstName}` : 'Hola'}
      </Text>

      <Button
        title="Registrar glucosa"
        icon="plus"
        size="large"
        onPress={() => router.push('/glucose/new')}
      />

      {latest.status === 'loading' ? (
        <Skeleton height={148} />
      ) : latest.status === 'error' && !latest.reading ? (
        <BlockError message={latest.errorMessage ?? ''} onRetry={latest.refresh} />
      ) : latest.reading ? (
        <LatestReadingCard reading={latest.reading} target={target} />
      ) : (
        <EmptyView
          icon="drop"
          title="Aún no tienes mediciones"
          message="Registra tu primera glucosa con el botón de arriba para empezar a ver tu progreso."
        />
      )}

      {todayLoading ? (
        <Skeleton height={220} />
      ) : todayFailed ? (
        <BlockError message={streak.errorMessage ?? ''} onRetry={refreshAll} />
      ) : (
        <TodayCard
          streak={streak.status === 'success' ? streak.streak : null}
          medications={meds.status === 'success' ? meds.medications : null}
          exercise={exercise.status === 'success' ? exercise.summary : null}
          busyMedicationId={meds.busyId}
          onLogIntake={(medication) => void meds.logIntake(medication)}
          onGoToMedications={() => router.push('/medications')}
          onRegisterActivity={() => router.push('/exercise/form')}
        />
      )}

      {stats.status === 'loading' ? (
        <Skeleton height={168} />
      ) : week && week.count > 0 ? (
        <WeekCard
          week={week}
          streak={streak.status === 'success' ? streak.streak : null}
          hba1c={hba1c.status === 'success' ? hba1c.projection : null}
          onSeeHistory={() => router.push('/glucose')}
        />
      ) : null}

      <View style={styles.footerSpace} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.lg },
  greeting: {
    fontSize: type.title.fontSize,
    lineHeight: type.title.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  footerSpace: { height: space.sm },
});

export default DashboardScreen;
