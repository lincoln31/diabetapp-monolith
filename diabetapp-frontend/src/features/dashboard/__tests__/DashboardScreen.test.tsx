import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import DashboardScreen from '../screens/DashboardScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@/src/features/auth', () => ({ useSession: () => ({ user: { firstName: 'Ana' } }) }));
jest.mock('@/src/features/notifications', () => ({ useNotificationSync: jest.fn() }));

const mockExercise = jest.fn();
jest.mock('@/src/features/exercise', () => ({ useExerciseSummary: () => mockExercise() }));

const mockStats = jest.fn();
jest.mock('../hooks/useDashboardStats', () => ({ useDashboardStats: () => mockStats() }));
const mockStreak = jest.fn();
jest.mock('../hooks/useStreak', () => ({ useStreak: () => mockStreak() }));
const mockHba1c = jest.fn();
jest.mock('../hooks/useHba1cProjection', () => ({ useHba1cProjection: () => mockHba1c() }));
const mockLatest = jest.fn();
jest.mock('../hooks/useLatestReading', () => ({ useLatestReading: () => mockLatest() }));
const mockMeds = jest.fn();
jest.mock('../hooks/useTodayMedications', () => ({ useTodayMedications: () => mockMeds() }));

const refresh = jest.fn();
const period = (over: object = {}) => ({
  days: 7,
  count: 9,
  average: 118,
  min: 90,
  max: 160,
  trend: 'improving',
  ...over,
});

const setup = (
  over: {
    latest?: object;
    meds?: object;
    stats?: object;
    streak?: object;
    exercise?: object;
  } = {},
) => {
  mockStats.mockReturnValue({
    status: 'success',
    refreshing: false,
    refresh,
    errorMessage: null,
    stats: {
      target: { min: 80, max: 180 },
      periods: { '7': period(), '14': period(), '30': period() },
    },
    ...over.stats,
  });
  mockStreak.mockReturnValue({
    status: 'success',
    refresh,
    errorMessage: null,
    streak: { current: 3, longest: 5, todayCount: 2, dailyGoal: 4, goalReachedToday: false },
    ...over.streak,
  });
  mockHba1c.mockReturnValue({
    status: 'success',
    refresh,
    projection: {
      sufficientData: true,
      projectedHba1c: 6.2,
      average90: 120,
      sampleCount: 40,
      targetHba1c: null,
    },
  });
  mockLatest.mockReturnValue({
    status: 'success',
    refresh,
    errorMessage: null,
    reading: {
      id: 'g1',
      value: 112,
      timestamp: new Date().toISOString(),
      momentOfDay: 'OTHER',
      notes: null,
      createdAt: '',
    },
    ...over.latest,
  });
  mockMeds.mockReturnValue({
    status: 'success',
    refresh,
    busyId: null,
    logIntake: jest.fn(),
    errorMessage: null,
    medications: [
      {
        id: 'm1',
        name: 'Metformina',
        dosage: '850 mg',
        scheduledTimes: ['08:00', '20:00'],
        notes: null,
        takenToday: 1,
      },
    ],
    ...over.meds,
  });
  mockExercise.mockReturnValue({
    status: 'success',
    refresh,
    summary: { todayMinutes: 20, goalMinutes: 30, last7DaysMinutes: 35 },
    ...over.exercise,
  });
};

describe('DashboardScreen — «Hoy»', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setup();
  });

  it('saluda y ofrece «Registrar glucosa» como acción principal, una sola vez', async () => {
    const { getByText, getAllByRole } = await render(<DashboardScreen />);

    expect(getByText('Hola, Ana')).toBeTruthy();
    expect(getAllByRole('button', { name: 'Registrar glucosa' })).toHaveLength(1);
  });

  it('«Registrar glucosa» abre el formulario', async () => {
    const { getByRole } = await render(<DashboardScreen />);

    await fireEvent.press(getByRole('button', { name: 'Registrar glucosa' }));

    expect(mockPush).toHaveBeenCalledWith('/glucose/new');
  });

  it('ya no acumula botones de destino: solo la acción principal y acciones del propio bloque', async () => {
    const { queryByRole, queryByText } = await render(<DashboardScreen />);

    for (const name of [
      'Mi perfil',
      'Mis Logros',
      'Educación',
      'Exportar reporte',
      'Cerrar sesión',
      'Mis Medicamentos',
      'Ejercicio',
    ]) {
      expect(queryByRole('button', { name })).toBeNull();
    }
    expect(queryByText('Consejo del día')).toBeNull();
  });

  it('muestra la última medición con su estado en texto', async () => {
    const { getByText } = await render(<DashboardScreen />);

    expect(getByText('112')).toBeTruthy();
    expect(getByText('En rango')).toBeTruthy();
  });

  it('muestra lecturas del día, tomas pendientes y ejercicio', async () => {
    const { getByText } = await render(<DashboardScreen />);

    expect(getByText('2 de 4 lecturas')).toBeTruthy();
    expect(getByText('Metformina · 850 mg')).toBeTruthy();
    expect(getByText('1 toma pendiente')).toBeTruthy();
    expect(getByText('20 de 30 min')).toBeTruthy();
  });

  it('«Tomé» registra la toma sin salir de la pantalla', async () => {
    const logIntake = jest.fn();
    setup({ meds: { logIntake } });
    const { getByRole } = await render(<DashboardScreen />);

    await fireEvent.press(getByRole('button', { name: 'Registrar toma de Metformina' }));

    expect(logIntake).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('con todas las tomas hechas lo dice con icono y texto', async () => {
    setup({
      meds: {
        medications: [
          {
            id: 'm1',
            name: 'Metformina',
            dosage: '850 mg',
            scheduledTimes: ['08:00'],
            notes: null,
            takenToday: 1,
          },
        ],
      },
    });
    const { getByText, queryByRole } = await render(<DashboardScreen />);

    expect(getByText('Tomas de hoy al día')).toBeTruthy();
    expect(queryByRole('button', { name: /Registrar toma de/ })).toBeNull();
  });

  it('resume la semana con promedio, tendencia, racha y HbA1c estimada', async () => {
    const { getByText } = await render(<DashboardScreen />);

    expect(getByText('118')).toBeTruthy();
    expect(getByText('Mejorando')).toBeTruthy();
    expect(getByText('días seguidos')).toBeTruthy();
    expect(getByText('6.2')).toBeTruthy();
  });

  it('sin mediciones muestra un estado vacío sin duplicar el botón principal', async () => {
    setup({
      latest: { reading: null },
      stats: {
        stats: {
          target: { min: 80, max: 180 },
          periods: {
            '7': period({ count: 0, average: null, trend: 'no_data' }),
            '14': period(),
            '30': period(),
          },
        },
      },
    });
    const { getByText, getAllByRole } = await render(<DashboardScreen />);

    expect(getByText('Aún no tienes mediciones')).toBeTruthy();
    expect(getAllByRole('button', { name: 'Registrar glucosa' })).toHaveLength(1);
  });

  it('si falla la última medición muestra su error con reintento y el resto sigue visible', async () => {
    setup({ latest: { status: 'error', reading: null, errorMessage: 'No se pudo conectar' } });
    const { getByText, getByRole } = await render(<DashboardScreen />);

    expect(getByText('No se pudo conectar')).toBeTruthy();
    expect(getByRole('button', { name: 'Reintentar' })).toBeTruthy();
    expect(getByText('2 de 4 lecturas')).toBeTruthy();
  });
});
