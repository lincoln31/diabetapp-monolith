import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';

jest.mock('expo-router', () => {
  const { View } = jest.requireActual('react-native');
  return {
    // `asChild` deja el hijo (un botón) como elemento tocable
    Link: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

const mockSignUp = jest.fn();
jest.mock('../AuthProvider', () => ({
  useSession: () => ({ signUp: mockSignUp, status: 'unauthenticated', user: null }),
}));

// Con la caché de Jest fría (siempre en la CI) el primer render tarda más del segundo
// que espera waitFor por defecto
const WAIT = { timeout: 5000 };

describe('RegisterScreen', () => {
  beforeEach(() => mockSignUp.mockReset());

  it('pide solo cuatro datos: nombre, correo, contraseña y la declaración de edad', async () => {
    const { getByLabelText, queryByLabelText, getByRole } = await render(<RegisterScreen />);

    expect(getByLabelText('Nombre')).toBeTruthy();
    expect(getByLabelText('Correo electrónico')).toBeTruthy();
    expect(getByLabelText('Contraseña')).toBeTruthy();
    expect(getByRole('checkbox')).toBeTruthy();
    // Lo que se completa después en el perfil
    expect(queryByLabelText('Apellido')).toBeNull();
    expect(queryByLabelText('Teléfono')).toBeNull();
    expect(queryByLabelText('Confirmar contraseña')).toBeNull();
  });

  it('muestra los errores al enviar el formulario vacío', async () => {
    const { getByText, getByRole } = await render(<RegisterScreen />);
    fireEvent.press(getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(getByText('El nombre debe tener mínimo 2 caracteres')).toBeTruthy();
    }, WAIT);
    expect(getByText('El correo electrónico es requerido')).toBeTruthy();
    expect(getByText('La contraseña debe tener mínimo 8 caracteres')).toBeTruthy();
    expect(getByText('Debes confirmar tu edad y aceptar los términos')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('borra el error de un campo cuando el usuario lo corrige', async () => {
    const { getByText, queryByText, getByLabelText, getByRole } = await render(<RegisterScreen />);
    fireEvent.press(getByRole('button', { name: 'Crear cuenta' }));
    await waitFor(() => expect(getByText('El correo electrónico es requerido')).toBeTruthy(), WAIT);

    fireEvent.changeText(getByLabelText('Correo electrónico'), 'ana@test.com');

    await waitFor(() => expect(queryByText('El correo electrónico es requerido')).toBeNull(), WAIT);
  });

  it('envía solo nombre, correo en minúsculas y contraseña', async () => {
    mockSignUp.mockResolvedValue(undefined);
    const { getByLabelText, getByRole } = await render(<RegisterScreen />);

    fireEvent.changeText(getByLabelText('Nombre'), '  Ana ');
    fireEvent.changeText(getByLabelText('Correo electrónico'), 'ANA@Test.com');
    fireEvent.changeText(getByLabelText('Contraseña'), 'Abcdef12');
    fireEvent.press(getByRole('checkbox'));
    fireEvent.press(getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled(), WAIT);
    expect(mockSignUp).toHaveBeenCalledWith({
      firstName: 'Ana',
      email: 'ana@test.com',
      password: 'Abcdef12',
    });
  });
});
