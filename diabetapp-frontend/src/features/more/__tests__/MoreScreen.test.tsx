import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import MoreScreen from '../screens/MoreScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));

const mockSignOut = jest.fn();
jest.mock('@/src/features/auth', () => ({
  useSession: () => ({
    user: { firstName: 'Ana', email: 'ana@test.com' },
    signOut: mockSignOut,
  }),
}));

jest.mock('@/src/features/dashboard', () => {
  const { Text } = jest.requireActual('react-native');
  return { ExportReportButton: () => <Text>Exportar reporte</Text> };
});

describe('MoreScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('agrupa perfil, notificaciones, logros, educación y reportes', async () => {
    const { getByRole, getByText } = await render(<MoreScreen />);

    expect(getByText('Ana · ana@test.com')).toBeTruthy();
    for (const name of [/Perfil y metas/, /Notificaciones/, /Logros/, /Educación/]) {
      expect(getByRole('button', { name })).toBeTruthy();
    }
    expect(getByText('Exportar reporte')).toBeTruthy();
  });

  it.each([
    [/Perfil y metas/, '/profile'],
    [/Notificaciones/, '/notifications'],
    [/Logros/, '/achievements'],
    [/Educación/, '/education'],
  ])('%s navega a %s', async (name, href) => {
    const { getByRole } = await render(<MoreScreen />);

    await fireEvent.press(getByRole('button', { name }));

    expect(mockPush).toHaveBeenCalledWith(href);
  });

  it('«Cerrar sesión» pide confirmación y solo entonces sale', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByRole } = await render(<MoreScreen />);

    await fireEvent.press(getByRole('button', { name: 'Cerrar sesión' }));

    expect(alertSpy).toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((b) => b.text === 'Cerrar sesión')!.onPress!();
    expect(mockSignOut).toHaveBeenCalled();
  });
});
