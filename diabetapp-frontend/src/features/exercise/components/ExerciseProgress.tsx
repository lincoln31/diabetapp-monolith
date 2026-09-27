import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/src/shared/components/ui';
import ProgressBar from '@/src/shared/components/ui/ProgressBar';
import { color, space, type } from '@/src/shared/theme/tokens';

interface ExerciseProgressProps {
  todayMinutes: number;
  goalMinutes: number;
}

/** «Hoy: X de Y min» con su barra (spec fase 12, RF-12.9, RF-12.13); la meta cumplida lleva icono y texto. */
const ExerciseProgress = ({ todayMinutes, goalMinutes }: ExerciseProgressProps) => {
  const reached = todayMinutes >= goalMinutes;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Hoy: {todayMinutes} de {goalMinutes} min
      </Text>
      <ProgressBar
        value={todayMinutes}
        max={goalMinutes}
        label={`${todayMinutes} de ${goalMinutes} minutos de ejercicio hoy`}
      />
      {reached ? (
        <View style={styles.reached}>
          <Icon name="check-circle" size={16} color={color.success} />
          <Text style={styles.reachedText}>Meta de hoy cumplida</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { rowGap: space.sm },
  text: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  reached: { flexDirection: 'row', alignItems: 'center', columnGap: space.xs },
  reachedText: { fontSize: type.caption.fontSize, fontWeight: '700', color: color.success },
});

export default ExerciseProgress;
