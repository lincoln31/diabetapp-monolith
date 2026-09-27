import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';

jest.mock('expo-router', () => {
  const { View } = jest.requireActual('react-native');
  return { Link: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

const mockSignIn = jest.fn();
jest.mock('../AuthProvider', () => ({
  useSession: () => ({ signIn: mockSignIn, status: 'unauthenticated', user: null }),
}));

const WAIT = { timeout: 5000 };

describe('LoginScreen', () => {
  beforeEach(() => mockSignIn.mockReset());

  it('no muestra textos con aspecto de enlace que no hagan nada ni emojis decorativos', async () => {
    const { queryByText } = await render(<LoginScreen />);

    expect(queryByText(/Olvidaste/)).toBeNull();
    expect(queryByText(/💪|🔒|🌟/u)).toBeNull();
  });

  it('ofrece crear una cuenta como acción secundaria', async () => {
    const { getByRole } = await render(<LoginScreen />);

    expect(getByRole('button', { name: 'Crear cuenta' })).toBeTruthy();
    expect(getByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('muestra los errores junto a los campos al enviar vacío', async () => {
    const { getByText, getByRole } = await render(<LoginScreen />);
    fireEvent.press(getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(getByText('El correo electrónico es requerido')).toBeTruthy(), WAIT);
    expect(getByText('La contraseña es requerida')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('el botón de la contraseña anuncia su acción y la muestra u oculta', async () => {
    const { getByRole, getByLabelText } = await render(<LoginScreen />);

    expect(getByLabelText('Contraseña').props.secureTextEntry).toBe(true);
    await fireEvent.press(getByRole('button', { name: 'Mostrar contraseña' }));

    expect(getByLabelText('Contraseña').props.secureTextEntry).toBe(false);
    expect(getByRole('button', { name: 'Ocultar contraseña' })).toBeTruthy();
  });

  it('inicia sesión con los datos escritos', async () => {
    mockSignIn.mockResolvedValue(undefined);
    const { getByLabelText, getByRole } = await render(<LoginScreen />);

    fireEvent.changeText(getByLabelText('Correo electrónico'), 'ana@test.com');
    fireEvent.changeText(getByLabelText('Contraseña'), 'Abcdef12');
    fireEvent.press(getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('ana@test.com', 'Abcdef12'), WAIT);
  });
});
