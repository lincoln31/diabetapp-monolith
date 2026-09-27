import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
} from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { color, space, type } from '@/src/shared/theme/tokens';
import ExerciseSummaryCard from '../components/ExerciseSummaryCard';
import { ACTIVITY_TYPE_LABEL } from '../constants';
import { useExercise } from '../hooks/useExercise';
import { ExerciseActivity } from '../types';

const formatStart = (iso: string): string => {
  const date = new Date(iso);
  const day = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
};

interface ActivityRowProps {
  activity: ExerciseActivity;
  onDelete: () => void;
}

const ActivityRow = ({ activity, onDelete }: ActivityRowProps) => (
  <Card padding="large" style={styles.row}>
    <View style={styles.rowText}>
      <Text style={styles.type}>
        {ACTIVITY_TYPE_LABEL[activity.type]} · {activity.durationMinutes} min
      </Text>
      <Text style={styles.date}>{formatStart(activity.startedAt)}</Text>
      {activity.notes ? <Text style={styles.notes}>{activity.notes}</Text> : null}
    </View>
    <Button
      title="Borrar"
      variant="tertiary"
      tone="danger"
      size="small"
      icon="trash"
      accessibilityLabel={`Borrar ${ACTIVITY_TYPE_LABEL[activity.type]} de ${activity.durationMinutes} minutos`}
      onPress={onDelete}
    />
  </Card>
);

/**
 * Pestaña Actividad (spec fase 12, RF-12.9, RF-12.12; rediseñada en la fase 15): resumen con la
 * comparación de glucosa arriba, historial y «Registrar actividad» fijo abajo.
 */
const ExerciseScreen = () => {
  const router = useRouter();
  const {
    status,
    activities,
    summary,
    errorMessage,
    offline,
    hasMore,
    loadingMore,
    refreshing,
    refresh,
    reload,
    loadMore,
    remove,
  } = useExercise();

  const confirmDelete = (activity: ExerciseActivity) =>
    Alert.alert(
      'Borrar actividad',
      `¿Borrar ${ACTIVITY_TYPE_LABEL[activity.type]} de ${activity.durationMinutes} min?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => void remove(activity.id) },
      ],
    );

  return (
    <Screen
      insetBottom={false}
      header={<ScreenHeader title="Actividad" showClose={false} safeTop={false} />}
      refreshing={refreshing}
      onRefresh={refresh}
      contentStyle={styles.content}
      footer={
        status === 'success' ? (
          <View style={styles.footer}>
            <Button
              title="Registrar actividad"
              icon="plus"
              size="large"
              onPress={() => router.push('/exercise/form')}
              style={styles.footerMain}
            />
            <Button
              title="Cronómetro"
              variant="secondary"
              size="large"
              onPress={() => router.push('/exercise/timer')}
            />
          </View>
        ) : undefined
      }
    >
      {status === 'loading' ? <LoadingView /> : null}

      {status === 'error' ? (
        <ErrorView message={errorMessage ?? ''} offline={offline} onRetry={reload} />
      ) : null}

      {status === 'success' ? (
        <>
          {summary ? <ExerciseSummaryCard summary={summary} /> : null}

          {activities.length === 0 ? (
            <EmptyView
              icon="walk"
              title="Aún no registras actividad"
              message="Registra una caminata, una rutina o usa el cronómetro para medirla."
            />
          ) : (
            activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                onDelete={() => confirmDelete(activity)}
              />
            ))
          )}

          {hasMore ? (
            <Button
              title="Cargar más"
              variant="secondary"
              onPress={loadMore}
              loading={loadingMore}
              disabled={loadingMore}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.lg },
  footer: { flexDirection: 'row', columnGap: space.sm },
  footerMain: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', columnGap: space.sm },
  rowText: { flex: 1, rowGap: space.xs },
  type: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  date: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
  },
  notes: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
    fontStyle: 'italic',
  },
});

export default ExerciseScreen;
