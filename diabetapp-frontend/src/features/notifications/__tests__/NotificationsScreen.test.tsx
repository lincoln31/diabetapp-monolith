import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../screens/NotificationsScreen';

const mockUseProfile = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/src/features/profile', () => ({
  useProfile: () => mockUseProfile(),
  profileApi: { update: (...args: unknown[]) => mockUpdate(...args) },
}));

const mockEnsurePermission = jest.fn();
jest.mock('../notifier', () => ({
  ensurePermission: () => mockEnsurePermission(),
}));

const mockSync = jest.fn();
jest.mock('../sync', () => ({ syncNotifications: () => mockSync() }));

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));

const profile = (overrides: object = {}) => ({
  notificationPreferences: {
    medicationReminders: false,
    glucoseReminders: false,
    motivational: false,
    achievements: false,
  },
  glucoseReminderTimes: [],
  ...overrides,
});

const loaded = (overrides: object = {}) => ({
  status: 'success',
  profile: profile(overrides),
  errorMessage: null,
  reload: jest.fn(),
});

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue(undefined);
    mockSync.mockResolvedValue(undefined);
  });

  it('muestra los cuatro tipos de aviso apagados por defecto', async () => {
    mockUseProfile.mockReturnValue(loaded());

    const { getByLabelText } = await render(<NotificationsScreen />);

    for (const title of [
      'Recordatorios de medicación',
      'Recordatorios de glucosa',
      'Mensaje motivacional',
      'Logros nuevos',
    ]) {
      expect(getByLabelText(title).props.value).toBe(false);
    }
  });

  it('al activar pide el permiso, guarda la preferencia y sincroniza', async () => {
    mockUseProfile.mockReturnValue(loaded());
    mockEnsurePermission.mockResolvedValue('granted');

    const { getByLabelText } = await render(<NotificationsScreen />);
    await fireEvent(getByLabelText('Mensaje motivacional'), 'valueChange', true);

    await waitFor(() => expect(mockSync).toHaveBeenCalled(), { timeout: 5000 });
    expect(mockEnsurePermission).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({ notificationPreferences: { motivational: true } });
    expect(getByLabelText('Mensaje motivacional').props.value).toBe(true);
  });

  it('si el permiso se deniega, el interruptor queda apagado y se explica cómo habilitarlo', async () => {
    mockUseProfile.mockReturnValue(loaded());
    mockEnsurePermission.mockResolvedValue('denied');

    const { getByLabelText, findByText } = await render(<NotificationsScreen />);
    await fireEvent(getByLabelText('Logros nuevos'), 'valueChange', true);

    expect(await findByText(/bloqueados en el celular/)).toBeTruthy();
    expect(getByLabelText('Logros nuevos').props.value).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('los horarios de glucosa no se ven con ese aviso apagado', async () => {
    mockUseProfile.mockReturnValue(loaded());

    const { queryByText } = await render(<NotificationsScreen />);

    expect(queryByText('Horarios (24 horas)')).toBeNull();
  });

  it('los horarios de glucosa se ven con ese aviso activo', async () => {
    mockUseProfile.mockReturnValue(
      loaded({
        notificationPreferences: {
          medicationReminders: false,
          glucoseReminders: true,
          motivational: false,
          achievements: false,
        },
        glucoseReminderTimes: ['07:30'],
      }),
    );

    const { getByText, getByDisplayValue } = await render(<NotificationsScreen />);

    expect(getByText('Horarios (24 horas)')).toBeTruthy();
    expect(getByDisplayValue('07:30')).toBeTruthy();
  });

  it('muestra el error del perfil con la opción de reintentar', async () => {
    const reload = jest.fn();
    mockUseProfile.mockReturnValue({
      status: 'error',
      profile: null,
      errorMessage: 'Sin conexión',
      reload,
    });

    const { getByText } = await render(<NotificationsScreen />);

    expect(getByText('Sin conexión')).toBeTruthy();
    await fireEvent.press(getByText('Reintentar'));
    expect(reload).toHaveBeenCalled();
  });
});
