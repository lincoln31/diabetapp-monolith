import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ExerciseSummaryCard from '../components/ExerciseSummaryCard';
import { exerciseFormSchema } from '../schemas';
import ExerciseScreen from '../screens/ExerciseScreen';
import { elapsedMs, formatElapsed, initialStopwatch, pause, start, toMinutes } from '../timer';
import { ExerciseActivity, ExerciseSummary } from '../types';

const mockUseExercise = jest.fn();
jest.mock('../hooks/useExercise', () => ({ useExercise: () => mockUseExercise() }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));

const summary = (overrides: Partial<ExerciseSummary> = {}): ExerciseSummary => ({
  todayMinutes: 20,
  goalMinutes: 30,
  last7DaysMinutes: 35,
  correlation: {
    sufficientData: false,
    withExercise: { days: 0, average: null },
    withoutExercise: { days: 0, average: null },
    difference: null,
  },
  ...overrides,
});

const activity = (overrides: Partial<ExerciseActivity> = {}): ExerciseActivity => ({
  id: 'a1',
  type: 'WALKING',
  durationMinutes: 30,
  startedAt: '2026-09-20T15:00:00.000Z',
  notes: null,
  ...overrides,
});

const state = (overrides: object = {}) => ({
  status: 'success',
  activities: [activity()],
  summary: summary(),
  errorMessage: null,
  hasMore: false,
  loadingMore: false,
  reload: jest.fn(),
  loadMore: jest.fn(),
  remove: jest.fn(),
  ...overrides,
});

describe('timer', () => {
  it('mide el tiempo con marcas de tiempo, también tras una pausa', () => {
    let state = start(initialStopwatch, 1_000);
    expect(elapsedMs(state, 61_000)).toBe(60_000);

    state = pause(state, 61_000);
    expect(elapsedMs(state, 500_000)).toBe(60_000); // en pausa no avanza

    state = start(state, 500_000);
    expect(elapsedMs(state, 530_000)).toBe(90_000);
  });

  it('start sobre un cronómetro corriendo no reinicia la marca', () => {
    const running = start(initialStopwatch, 1_000);
    expect(start(running, 9_000)).toBe(running);
  });

  it('redondea los minutos hacia arriba con mínimo 1', () => {
    expect(toMinutes(130_000)).toBe(3); // 2 min 10 s
    expect(toMinutes(120_000)).toBe(2);
    expect(toMinutes(1_000)).toBe(1);
    expect(toMinutes(0)).toBe(1);
  });

  it('da formato mm:ss y h:mm:ss', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(65_000)).toBe('01:05');
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
  });
});

describe('exerciseFormSchema', () => {
  const valid = { type: 'WALKING' as const, durationMinutes: '30', notes: '' };

  it('acepta una actividad válida', () => {
    expect(exerciseFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['vacía', ''],
    ['texto', 'abc'],
    ['decimal', '12.5'],
    ['cero', '0'],
    ['negativa', '-5'],
    ['mayor a 600', '601'],
  ])('rechaza una duración %s', (_name, durationMinutes) => {
    expect(exerciseFormSchema.safeParse({ ...valid, durationMinutes }).success).toBe(false);
  });
});

describe('ExerciseSummaryCard', () => {
  it('muestra el avance de hoy y los 7 días sin comparación si faltan datos', async () => {
    const { getByText, queryByText } = await render(<ExerciseSummaryCard summary={summary()} />);

    expect(getByText('Hoy: 20 de 30 min')).toBeTruthy();
    expect(getByText('Últimos 7 días: 35 min')).toBeTruthy();
    expect(queryByText(/Días con ejercicio/)).toBeNull();
  });

  it('muestra la comparación con la aclaración cuando hay datos suficientes', async () => {
    const { getByText } = await render(
      <ExerciseSummaryCard
        summary={summary({
          correlation: {
            sufficientData: true,
            withExercise: { days: 6, average: 118 },
            withoutExercise: { days: 12, average: 141 },
            difference: -23,
          },
        })}
      />,
    );

    expect(getByText('Días con ejercicio: 118 mg/dL')).toBeTruthy();
    expect(getByText('Días sin ejercicio: 141 mg/dL')).toBeTruthy();
    expect(getByText(/no prueba que el ejercicio sea la causa/)).toBeTruthy();
  });

  it('avisa cuando la meta de hoy está cumplida', async () => {
    const { getByText } = await render(
      <ExerciseSummaryCard summary={summary({ todayMinutes: 40 })} />,
    );

    expect(getByText('Meta de hoy cumplida')).toBeTruthy();
  });
});

describe('ExerciseScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('muestra el avance de hoy y la actividad del historial', async () => {
    mockUseExercise.mockReturnValue(state());

    const { getByText } = await render(<ExerciseScreen />);

    expect(getByText('Hoy: 20 de 30 min')).toBeTruthy();
    expect(getByText('Caminar · 30 min')).toBeTruthy();
  });

  it('con el historial vacío muestra el estado vacío y el avance en cero', async () => {
    mockUseExercise.mockReturnValue(
      state({ activities: [], summary: summary({ todayMinutes: 0 }) }),
    );

    const { getByText } = await render(<ExerciseScreen />);

    expect(getByText('Aún no registras actividad')).toBeTruthy();
    expect(getByText('Hoy: 0 de 30 min')).toBeTruthy();
  });

  it('lleva al formulario y al cronómetro', async () => {
    mockUseExercise.mockReturnValue(state());

    const { getByText } = await render(<ExerciseScreen />);
    await fireEvent.press(getByText('Registrar actividad'));
    await fireEvent.press(getByText('Cronómetro'));

    expect(mockPush).toHaveBeenCalledWith('/exercise/form');
    expect(mockPush).toHaveBeenCalledWith('/exercise/timer');
  });

  it('ofrece «Cargar más» solo si hay más páginas', async () => {
    const loadMore = jest.fn();
    mockUseExercise.mockReturnValue(state({ hasMore: true, loadMore }));

    const { getByText } = await render(<ExerciseScreen />);
    await fireEvent.press(getByText('Cargar más'));

    expect(loadMore).toHaveBeenCalled();
  });

  it('muestra el error con la opción de reintentar', async () => {
    const reload = jest.fn();
    mockUseExercise.mockReturnValue(
      state({ status: 'error', activities: [], errorMessage: 'Sin conexión', reload }),
    );

    const { getByText } = await render(<ExerciseScreen />);

    expect(getByText('Sin conexión')).toBeTruthy();
    await fireEvent.press(getByText('Reintentar'));
    expect(reload).toHaveBeenCalled();
  });
});
