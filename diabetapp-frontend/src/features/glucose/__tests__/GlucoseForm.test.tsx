import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import GlucoseForm from '../components/GlucoseForm';
import { GlucoseReading } from '../types';

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush }) }));

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
jest.mock('../api', () => ({
  glucoseApi: {
    create: (...a: unknown[]) => mockCreate(...a),
    update: (...a: unknown[]) => mockUpdate(...a),
    remove: (...a: unknown[]) => mockRemove(...a),
  },
}));

jest.mock('@/src/features/profile', () => ({
  useProfile: () => ({ profile: { targetGlucoseMin: 80, targetGlucoseMax: 180 } }),
}));

const mockEnsurePermission = jest.fn();
const mockScheduleReminder = jest.fn();
jest.mock('@/src/features/notifications', () => ({
  ensurePermission: (...a: unknown[]) => mockEnsurePermission(...a),
  scheduleReminder: (...a: unknown[]) => mockScheduleReminder(...a),
}));

const mockShow = jest.fn();
jest.mock('@/src/shared/components/ui/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({ show: mockShow }),
}));

const WAIT = { timeout: 5000 };

const reading: GlucoseReading = {
  id: 'g1',
  value: 1100,
  timestamp: new Date(2026, 8, 20, 8, 5).toISOString(),
  momentOfDay: 'BEFORE_BREAKFAST',
  notes: null,
  createdAt: new Date(2026, 8, 20, 8, 5).toISOString(),
};

describe('GlucoseForm — registrar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pide primero el valor y deja lo demás con valores por defecto', async () => {
    const { getByLabelText, getByText, queryByText, getByRole } = await render(<GlucoseForm />);

    expect(getByLabelText('Nivel de glucosa').props.autoFocus).toBe(true);
    expect(getByText(/^Hoy, /)).toBeTruthy(); // «Ahora» por defecto
    expect(getByRole('button', { name: 'Cambiar' })).toBeTruthy();
    expect(getByLabelText('Momento del día')).toBeTruthy();
    expect(getByRole('radio', { name: 'En ayunas' })).toBeTruthy();
    expect(getByRole('button', { name: 'Agregar nota' })).toBeTruthy(); // notas plegadas
    // Lo que se eliminó del formulario
    expect(queryByText(/Niveles de referencia/)).toBeNull();
    expect(queryByText(/Usar fecha y hora actual/)).toBeNull();
  });

  it('propone un momento del día según la hora, no siempre «En ayunas»', async () => {
    const at = (h: number) => new Date(2026, 8, 26, h, 0);
    jest.useFakeTimers({
      now: at(20),
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'nextTick',
        'queueMicrotask',
      ],
    });
    try {
      const { getByRole } = await render(<GlucoseForm />);

      expect(
        getByRole('radio', { name: 'Después de la cena' }).props.accessibilityState,
      ).toMatchObject({ checked: true });
    } finally {
      jest.useRealTimers();
    }
  });

  it('muestra el error junto al campo si el valor está fuera de 20–600', async () => {
    const { getByLabelText, getByRole, getByText } = await render(<GlucoseForm />);

    await fireEvent.changeText(getByLabelText('Nivel de glucosa'), '700');
    await fireEvent.press(getByRole('button', { name: 'Guardar medición' }));

    await waitFor(
      () => expect(getByText('El valor debe estar entre 20 y 600 mg/dL')).toBeTruthy(),
      WAIT,
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('avisa con icono y texto si el valor está por encima del rango personal', async () => {
    const { getByLabelText, getByText } = await render(<GlucoseForm />);

    await fireEvent.changeText(getByLabelText('Nivel de glucosa'), '250');

    expect(getByText(/Por encima de tu rango \(80–180 mg\/dL\)/)).toBeTruthy();
  });

  it('guarda, avisa sin bloquear y vuelve a la pantalla anterior', async () => {
    mockCreate.mockResolvedValue({ id: 'nuevo' });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByLabelText, getByRole } = await render(<GlucoseForm />);

    await fireEvent.changeText(getByLabelText('Nivel de glucosa'), '112');
    await fireEvent.press(getByRole('button', { name: 'Guardar medición' }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled(), WAIT);
    expect(mockCreate.mock.calls[0][0]).toMatchObject({ value: 112 });
    await waitFor(() => expect(mockBack).toHaveBeenCalled(), WAIT);
    expect(mockShow).toHaveBeenCalledWith('Medición guardada: 112 mg/dL');
    expect(alertSpy).not.toHaveBeenCalled(); // sin «¡Éxito!» modal
  });

  it('con «Recordármelo en 2 horas» marcado, programa el recordatorio al guardar', async () => {
    mockCreate.mockResolvedValue({ id: 'nuevo' });
    mockEnsurePermission.mockResolvedValue('granted');
    const { getByLabelText, getByRole } = await render(<GlucoseForm />);

    await fireEvent.changeText(getByLabelText('Nivel de glucosa'), '112');
    await fireEvent.press(getByRole('checkbox', { name: 'Recordármelo en 2 horas' }));
    await fireEvent.press(getByRole('button', { name: 'Guardar medición' }));

    await waitFor(() => expect(mockScheduleReminder).toHaveBeenCalled(), WAIT);
    expect(mockScheduleReminder.mock.calls[0][0]).toBe('glucose-reminder-nuevo');
    expect(mockScheduleReminder.mock.calls[0][3].getTime() - Date.now()).toBeGreaterThan(
      1000 * 60 * 60, // ~2 horas, con margen para lo que tarda el test
    );
  });

  it('sin marcar «Recordármelo en 2 horas», no programa nada', async () => {
    mockCreate.mockResolvedValue({ id: 'nuevo' });
    const { getByLabelText, getByRole } = await render(<GlucoseForm />);

    await fireEvent.changeText(getByLabelText('Nivel de glucosa'), '112');
    await fireEvent.press(getByRole('button', { name: 'Guardar medición' }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled(), WAIT);
    expect(mockScheduleReminder).not.toHaveBeenCalled();
    expect(mockEnsurePermission).not.toHaveBeenCalled();
  });

  it('«Calcular dosis de insulina» lleva la glucosa escrita como parámetro', async () => {
    const { getByLabelText, getByRole } = await render(<GlucoseForm />);

    await fireEvent.changeText(getByLabelText('Nivel de glucosa'), '150');
    await fireEvent.press(getByRole('button', { name: 'Calcular dosis de insulina' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/education/insulin-calculator',
      params: { glucose: '150' },
    });
  });

  it('«Calcular dosis de insulina» sin glucosa escrita no manda el parámetro', async () => {
    const { getByRole } = await render(<GlucoseForm />);

    await fireEvent.press(getByRole('button', { name: 'Calcular dosis de insulina' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/education/insulin-calculator',
      params: undefined,
    });
  });

  it('si falla por la red muestra el error y conserva lo escrito', async () => {
    mockCreate.mockRejectedValue({ isAxiosError: true, message: 'Network Error' });
    const { getByLabelText, getByRole, findByRole } = await render(<GlucoseForm />);

    await fireEvent.changeText(getByLabelText('Nivel de glucosa'), '112');
    await fireEvent.press(getByRole('button', { name: 'Guardar medición' }));

    expect(await findByRole('alert', undefined, WAIT)).toBeTruthy();
    expect(getByLabelText('Nivel de glucosa').props.value).toBe('112');
    expect(mockBack).not.toHaveBeenCalled();
  });
});

describe('GlucoseForm — editar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('precarga la medición y ofrece guardar cambios y borrar, separados', async () => {
    const { getByLabelText, getByRole } = await render(<GlucoseForm reading={reading} />);

    expect(getByLabelText('Nivel de glucosa').props.value).toBe('1100');
    expect(getByRole('button', { name: 'Guardar cambios' })).toBeTruthy();
    expect(getByRole('button', { name: 'Borrar medición' })).toBeTruthy();
  });

  it('corrige un valor mal tecleado', async () => {
    mockUpdate.mockResolvedValue({});
    const { getByLabelText, getByRole } = await render(<GlucoseForm reading={reading} />);

    await fireEvent.changeText(getByLabelText('Nivel de glucosa'), '110');
    await fireEvent.press(getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled(), WAIT);
    expect(mockUpdate.mock.calls[0][0]).toBe('g1');
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({ value: 110 });
  });

  it('borrar pide confirmación y solo entonces elimina', async () => {
    mockRemove.mockResolvedValue(null);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByRole } = await render(<GlucoseForm reading={reading} />);

    await fireEvent.press(getByRole('button', { name: 'Borrar medición' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'Borrar medición',
      'Esta acción no se puede deshacer.',
      expect.any(Array),
    );
    expect(mockRemove).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    await buttons.find((b) => b.text === 'Borrar')!.onPress!();

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('g1'), WAIT);
    expect(mockShow).toHaveBeenCalledWith('Medición borrada');
  });
});
