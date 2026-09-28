import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import { ExerciseSummary } from '../types';
import ExerciseProgress from './ExerciseProgress';

/** Tarjeta de ejercicio del dashboard (spec fase 12, RF-12.13). */
const ExerciseSummaryCard = ({ summary }: { summary: ExerciseSummary }) => {
  const { todayMinutes, goalMinutes, last7DaysMinutes, correlation } = summary;
  const { withExercise, withoutExercise } = correlation;

  return (
    <Card padding="large" style={styles.card}>
      <Text style={styles.title}>Tu ejercicio</Text>
      <ExerciseProgress todayMinutes={todayMinutes} goalMinutes={goalMinutes} />
      <Text style={styles.week}>Últimos 7 días: {last7DaysMinutes} min</Text>

      {correlation.sufficientData &&
        withExercise.average !== null &&
        withoutExercise.average !== null && (
          <View style={styles.correlation}>
            <Text style={styles.correlationTitle}>Tu glucosa promedio (30 días)</Text>
            <Text style={styles.correlationLine}>
              Días con ejercicio: {withExercise.average} mg/dL
            </Text>
            <Text style={styles.correlationLine}>
              Días sin ejercicio: {withoutExercise.average} mg/dL
            </Text>
            <Text style={styles.disclaimer}>
              Es una asociación, no prueba que el ejercicio sea la causa.
            </Text>
          </View>
        )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.gray[500], marginBottom: 8 },
  week: { fontSize: 13, color: COLORS.gray[500], marginTop: 10 },
  correlation: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  correlationTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray[600], marginBottom: 4 },
  correlationLine: { fontSize: 15, fontWeight: '600', color: COLORS.gray[800], marginTop: 2 },
  disclaimer: { fontSize: 12, color: COLORS.gray[500], marginTop: 8 },
});

export default ExerciseSummaryCard;
