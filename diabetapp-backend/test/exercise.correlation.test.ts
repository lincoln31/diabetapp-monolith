import { correlateExerciseGlucose } from '../src/modules/exercise/exercise.correlation';

const day = (date: string, total: number, count: number) => ({ day: date, total, count });

describe('correlateExerciseGlucose', () => {
  it('sin datos: insuficiente y sin promedios', () => {
    expect(correlateExerciseGlucose(new Set(), [])).toEqual({
      sufficientData: false,
      withExercise: { days: 0, average: null },
      withoutExercise: { days: 0, average: null },
      difference: null,
    });
  });

  it('con menos de 5 lecturas en un grupo es insuficiente pero informa los días', () => {
    const result = correlateExerciseGlucose(new Set(['2026-09-01']), [
      day('2026-09-01', 300, 3),
      day('2026-09-02', 900, 6),
    ]);

    expect(result.sufficientData).toBe(false);
    expect(result.withExercise).toEqual({ days: 1, average: null });
    expect(result.withoutExercise).toEqual({ days: 1, average: null });
    expect(result.difference).toBeNull();
  });

  it('con datos suficientes calcula ambos promedios y la diferencia', () => {
    const result = correlateExerciseGlucose(new Set(['2026-09-01', '2026-09-03']), [
      day('2026-09-01', 600, 5),
      day('2026-09-02', 750, 5),
      day('2026-09-03', 300, 3),
    ]);

    // con ejercicio: 900 / 8 = 112,5 → 113; sin: 750 / 5 = 150
    expect(result).toEqual({
      sufficientData: true,
      withExercise: { days: 2, average: 113 },
      withoutExercise: { days: 1, average: 150 },
      difference: -37,
    });
  });

  it('pondera por lecturas: no promedia los promedios diarios', () => {
    const result = correlateExerciseGlucose(new Set(['2026-09-01']), [
      day('2026-09-01', 100, 1),
      day('2026-09-02', 100 * 9 + 200, 10),
      day('2026-09-04', 500, 5),
    ]);

    // con ejercicio tiene solo 1 lectura → insuficiente aunque haya otros días sin ejercicio
    expect(result.sufficientData).toBe(false);
  });

  it('ignora los días sin lecturas', () => {
    const result = correlateExerciseGlucose(new Set(['2026-09-01']), [
      day('2026-09-01', 0, 0),
      day('2026-09-02', 500, 5),
    ]);

    expect(result.withExercise.days).toBe(0);
  });
});
