import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { COLORS } from '@/src/shared/theme/colors';
import ExerciseProgress from '../components/ExerciseProgress';
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
      {activity.notes && <Text style={styles.notes}>{activity.notes}</Text>}
    </View>
    <Button title="Borrar" variant="outline" size="small" onPress={onDelete} />
  </Card>
);

/** Pantalla «Ejercicio» (spec fase 12, RF-12.9, RF-12.12). */
const ExerciseScreen = () => {
  const router = useRouter();
  const {
    status,
    activities,
    summary,
    errorMessage,
    hasMore,
    loadingMore,
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
    <View style={styles.container}>
      <ScreenHeader title="Actividad" showClose={false} />

      {status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button title="Reintentar" variant="outline" onPress={reload} />
        </View>
      )}

      {status === 'success' && (
        <ScrollView contentContainerStyle={styles.list}>
          {summary && (
            <Card padding="large" style={styles.progress}>
              <ExerciseProgress
                todayMinutes={summary.todayMinutes}
                goalMinutes={summary.goalMinutes}
              />
            </Card>
          )}

          <View style={styles.actions}>
            <Button
              title="Registrar actividad"
              onPress={() => router.push('/exercise/form')}
              style={styles.actionMain}
            />
            <Button
              title="Cronómetro"
              variant="outline"
              onPress={() => router.push('/exercise/timer')}
            />
          </View>

          {activities.length === 0 && (
            <Card padding="large">
              <Text style={styles.emptyTitle}>Aún no registras actividad</Text>
              <Text style={styles.emptyText}>
                Registra una caminata, una rutina o usa el cronómetro para medirla.
              </Text>
            </Card>
          )}

          {activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onDelete={() => confirmDelete(activity)}
            />
          ))}

          {hasMore && (
            <Button
              title="Cargar más"
              variant="outline"
              onPress={loadMore}
              loading={loadingMore}
              disabled={loadingMore}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginBottom: 16 },
  list: { padding: 20, paddingTop: 4 },
  progress: { marginBottom: 12 },
  actions: { flexDirection: 'row', columnGap: 8, marginBottom: 12 },
  actionMain: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, columnGap: 8 },
  rowText: { flex: 1 },
  type: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  date: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  notes: { fontSize: 13, color: COLORS.gray[600], marginTop: 4, fontStyle: 'italic' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  emptyText: { fontSize: 14, color: COLORS.gray[600], marginTop: 6, lineHeight: 20 },
});

export default ExerciseScreen;
