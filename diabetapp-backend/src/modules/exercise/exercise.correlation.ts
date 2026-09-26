import { CorrelationResult, GroupStats } from './exercise.schemas';

export interface DayGlucose {
  /** Día local 'YYYY-MM-DD'. */
  day: string;
  total: number;
  count: number;
}

/** Lecturas mínimas por grupo para mostrar una comparación (spec fase 12, RF-12.6). */
export const MIN_READINGS_PER_GROUP = 5;

interface Accumulator {
  days: number;
  total: number;
  count: number;
}

const toStats = ({ days, total, count }: Accumulator, sufficient: boolean): GroupStats => ({
  days,
  average: sufficient && count > 0 ? Math.round(total / count) : null,
});

/**
 * Compara la glucosa de los días con actividad contra los días sin ella (spec fase 12, D-12.4).
 * Pondera por lecturas (no promedia promedios diarios); los días sin lecturas no aportan a
 * ningún grupo. Con menos de `MIN_READINGS_PER_GROUP` lecturas en algún grupo no hay número.
 */
export const correlateExerciseGlucose = (
  exerciseDays: Set<string>,
  glucose: DayGlucose[],
): CorrelationResult => {
  const withExercise: Accumulator = { days: 0, total: 0, count: 0 };
  const withoutExercise: Accumulator = { days: 0, total: 0, count: 0 };

  for (const entry of glucose) {
    if (entry.count === 0) continue;
    const group = exerciseDays.has(entry.day) ? withExercise : withoutExercise;
    group.days += 1;
    group.total += entry.total;
    group.count += entry.count;
  }

  const sufficientData =
    withExercise.count >= MIN_READINGS_PER_GROUP && withoutExercise.count >= MIN_READINGS_PER_GROUP;

  const withStats = toStats(withExercise, sufficientData);
  const withoutStats = toStats(withoutExercise, sufficientData);

  return {
    sufficientData,
    withExercise: withStats,
    withoutExercise: withoutStats,
    difference:
      withStats.average !== null && withoutStats.average !== null
        ? withStats.average - withoutStats.average
        : null,
  };
};
