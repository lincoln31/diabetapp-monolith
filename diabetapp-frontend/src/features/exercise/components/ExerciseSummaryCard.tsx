import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/shared/components/ui';
import { color, space, type } from '@/src/shared/theme/tokens';
import { ExerciseSummary } from '../types';
import ExerciseProgress from './ExerciseProgress';

/** Resumen de ejercicio (spec fase 12, RF-12.13; ahora en la pestaña Actividad, fase 15). */
const ExerciseSummaryCard = ({ summary }: { summary: ExerciseSummary }) => {
  const { todayMinutes, goalMinutes, last7DaysMinutes, correlation } = summary;
  const { withExercise, withoutExercise } = correlation;

  return (
    <Card padding="large" style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Tu ejercicio
      </Text>
      <ExerciseProgress todayMinutes={todayMinutes} goalMinutes={goalMinutes} />
      <Text style={styles.week}>Últimos 7 días: {last7DaysMinutes} min</Text>

      {correlation.sufficientData &&
      withExercise.average !== null &&
      withoutExercise.average !== null ? (
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
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { rowGap: space.sm },
  title: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  week: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
  },
  correlation: {
    marginTop: space.sm,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color.border,
    rowGap: space.xs,
  },
  correlationTitle: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.textMuted,
  },
  correlationLine: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  disclaimer: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
  },
});

export default ExerciseSummaryCard;
