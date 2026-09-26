import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/shared/theme/colors';

interface ExerciseProgressProps {
  todayMinutes: number;
  goalMinutes: number;
}

/** «Hoy: X de Y min» con una barra de avance (spec fase 12, RF-12.9, RF-12.13). */
const ExerciseProgress = ({ todayMinutes, goalMinutes }: ExerciseProgressProps) => {
  const ratio = goalMinutes > 0 ? Math.min(1, todayMinutes / goalMinutes) : 0;
  const reached = todayMinutes >= goalMinutes;

  return (
    <View>
      <Text style={styles.text}>
        Hoy: {todayMinutes} de {goalMinutes} min
      </Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(ratio * 100)}%` },
            reached && styles.fillReached,
          ]}
        />
      </View>
      {reached && <Text style={styles.reached}>Meta de hoy cumplida</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  text: { fontSize: 15, fontWeight: '600', color: COLORS.gray[800] },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[100],
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  fillReached: { backgroundColor: COLORS.green[700] },
  reached: { fontSize: 12, fontWeight: '600', color: COLORS.green[700], marginTop: 6 },
});

export default ExerciseProgress;
