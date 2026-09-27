import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import GlucoseHistoryScreen from '../screens/GlucoseHistoryScreen';
import { GlucoseReading } from '../types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));

const mockUseHistory = jest.fn();
jest.mock('../hooks/useGlucoseHistory', () => ({
  useGlucoseHistory: (days: number) => mockUseHistory(days),
}));

jest.mock('@/src/features/profile', () => ({
  useProfile: () => ({ profile: { targetGlucoseMin: 80, targetGlucoseMax: 180 } }),
}));

const at = (day: number, hour: number) => new Date(2026, 8, day, hour, 0).toISOString();
const reading = (id: string, value: number, iso: string): GlucoseReading => ({
  id,
  value,
  timestamp: iso,
  momentOfDay: 'BEFORE_BREAKFAST',
  notes: null,
  createdAt: iso,
});

const state = (overrides: object = {}) => ({
  status: 'success',
  readings: [
    reading('a', 100, at(26, 8)),
    reading('b', 250, at(26, 14)),
    reading('c', 60, at(25, 9)),
  ],
  total: 3,
  errorMessage: null,
  offline: false,
  refreshing: false,
  refresh: jest.fn(),
  retry: jest.fn(),
  ...overrides,
});

describe('GlucoseHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHistory.mockReturnValue(state());
  });

  it('muestra el resumen del período: promedio, mínimo y máximo', async () => {
    const { getByText, getAllByText } = await render(<GlucoseHistoryScreen />);

    expect(getByText('137')).toBeTruthy(); // (100 + 250 + 60) / 3
    expect(getAllByText('60').length).toBeGreaterThan(0);
    expect(getAllByText('250').length).toBeGreaterThan(0);
    expect(getByText(/3 mediciones en los últimos 7 días/)).toBeTruthy();
  });

  it('describe el gráfico para lectores de pantalla y deja la lista como alternativa', async () => {
    const { getByRole, getAllByRole } = await render(<GlucoseHistoryScreen />);

    expect(
      getByRole('image', { name: /Tendencia: 3 mediciones, promedio 137 mg\/dL, entre 60 y 250/ }),
    ).toBeTruthy();
    expect(getAllByRole('button', { name: /mg\/dL, .*Toca para editar/ })).toHaveLength(3);
  });

  it('comunica el estado de cada medición con texto, no solo con color', async () => {
    const { getAllByRole } = await render(<GlucoseHistoryScreen />);
    const labels = getAllByRole('button', { name: /Toca para editar/ }).map(
      (b) => b.props.accessibilityLabel,
    );

    expect(labels.some((l: string) => l.includes('En rango'))).toBe(true);
    expect(labels.some((l: string) => l.includes('Alto'))).toBe(true);
    expect(labels.some((l: string) => l.includes('Bajo'))).toBe(true);
  });

  it('agrupa las mediciones por día', async () => {
    const { getByText } = await render(<GlucoseHistoryScreen />);

    expect(getByText('Hoy')).toBeTruthy();
  });

  it('tocar una medición abre su edición', async () => {
    const { getAllByRole } = await render(<GlucoseHistoryScreen />);

    await fireEvent.press(getAllByRole('button', { name: /Toca para editar/ })[0]);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/glucose/[id]',
      params: { id: expect.any(String) },
    });
  });

  it('cambiar el período pide 30 días', async () => {
    const { getByRole } = await render(<GlucoseHistoryScreen />);

    await fireEvent.press(getByRole('radio', { name: '30 días' }));

    expect(mockUseHistory).toHaveBeenLastCalledWith(30);
  });

  it('«Registrar glucosa» está siempre a mano', async () => {
    const { getByRole } = await render(<GlucoseHistoryScreen />);

    await fireEvent.press(getByRole('button', { name: 'Registrar glucosa' }));

    expect(mockPush).toHaveBeenCalledWith('/glucose/new');
  });

  it('sin mediciones muestra un estado vacío', async () => {
    mockUseHistory.mockReturnValue(state({ readings: [], total: 0 }));
    const { getByText } = await render(<GlucoseHistoryScreen />);

    expect(getByText('Aún no hay mediciones en este período')).toBeTruthy();
  });

  it('sin conexión lo dice y permite reintentar', async () => {
    const retry = jest.fn();
    mockUseHistory.mockReturnValue(
      state({
        status: 'error',
        readings: [],
        errorMessage: 'Revisa tu conexión',
        offline: true,
        retry,
      }),
    );
    const { getByText, getByRole } = await render(<GlucoseHistoryScreen />);

    expect(getByText('Sin conexión')).toBeTruthy();
    await fireEvent.press(getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalled();
  });

  it('mientras carga muestra el indicador de carga', async () => {
    mockUseHistory.mockReturnValue(state({ status: 'loading', readings: [] }));
    const { getByText } = await render(<GlucoseHistoryScreen />);

    expect(getByText('Cargando…')).toBeTruthy();
  });
});
