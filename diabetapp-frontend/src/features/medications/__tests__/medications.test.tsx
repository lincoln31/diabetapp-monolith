import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AdherenceCard from '../components/AdherenceCard';
import { medicationFormSchema } from '../schemas';
import MedicationsScreen from '../screens/MedicationsScreen';
import { AdherenceStats, Medication } from '../types';

const mockUseMedications = jest.fn();
jest.mock('../hooks/useMedications', () => ({
  useMedications: () => mockUseMedications(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));

const medication = (overrides: Partial<Medication> = {}): Medication => ({
  id: 'm1',
  name: 'Metformina',
  dosage: '850 mg',
  scheduledTimes: ['08:00', '20:00'],
  notes: null,
  takenToday: 1,
  ...overrides,
});

const state = (overrides: object = {}) => ({
  status: 'success',
  medications: [medication()],
  errorMessage: null,
  busyId: null,
  reload: jest.fn(),
  logIntake: jest.fn(),
  ...overrides,
});

describe('MedicationsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('muestra el medicamento con sus horarios y las tomas de hoy', async () => {
    mockUseMedications.mockReturnValue(state());

    const { getByText } = await render(<MedicationsScreen />);

    expect(getByText('Metformina')).toBeTruthy();
    expect(getByText('850 mg')).toBeTruthy();
    expect(getByText('Horarios: 08:00 · 20:00')).toBeTruthy();
    expect(getByText('1 de 2 tomas hoy')).toBeTruthy();
  });

  it('registra la toma al tocar «Registrar toma»', async () => {
    const logIntake = jest.fn();
    mockUseMedications.mockReturnValue(state({ logIntake }));

    const { getByText } = await render(<MedicationsScreen />);
    await fireEvent.press(getByText('Registrar toma'));

    expect(logIntake).toHaveBeenCalledWith('m1');
  });

  it('con la lista vacía invita a agregar el primer medicamento', async () => {
    mockUseMedications.mockReturnValue(state({ medications: [] }));

    const { getByText } = await render(<MedicationsScreen />);

    expect(getByText('Aún no tienes medicamentos')).toBeTruthy();
    await fireEvent.press(getByText('Agregar medicamento'));
    expect(mockPush).toHaveBeenCalledWith('/medications/form');
  });

  it('muestra el error con la opción de reintentar', async () => {
    const reload = jest.fn();
    mockUseMedications.mockReturnValue(
      state({ status: 'error', medications: [], errorMessage: 'Sin conexión', reload }),
    );

    const { getByText } = await render(<MedicationsScreen />);

    expect(getByText('Sin conexión')).toBeTruthy();
    await fireEvent.press(getByText('Reintentar'));
    expect(reload).toHaveBeenCalled();
  });
});

describe('AdherenceCard', () => {
  const adherence: AdherenceStats = {
    days7: { expected: 14, taken: 12, percent: 86 },
    days30: { expected: 0, taken: 0, percent: null },
  };

  it('muestra el porcentaje de 7 días y un guion cuando no hay datos de 30', async () => {
    const { getByText } = await render(<AdherenceCard adherence={adherence} />);

    expect(getByText('86 %')).toBeTruthy();
    expect(getByText('12 de 14 tomas')).toBeTruthy();
    expect(getByText('—')).toBeTruthy();
  });
});

describe('medicationFormSchema', () => {
  const valid = {
    name: 'Metformina',
    dosage: '850 mg',
    scheduledTimes: ['08:00', '20:00'],
    notes: '',
  };

  it('acepta un medicamento válido', () => {
    expect(medicationFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['nombre vacío', { ...valid, name: ' ' }],
    ['dosis vacía', { ...valid, dosage: '' }],
    ['sin horarios', { ...valid, scheduledTimes: [] }],
    ['horario vacío', { ...valid, scheduledTimes: [''] }],
    ['horario mal escrito', { ...valid, scheduledTimes: ['8:00'] }],
    ['hora inexistente', { ...valid, scheduledTimes: ['25:00'] }],
    ['horarios repetidos', { ...valid, scheduledTimes: ['08:00', '08:00'] }],
  ])('rechaza %s', (_name, values) => {
    expect(medicationFormSchema.safeParse(values).success).toBe(false);
  });
});
