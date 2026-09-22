import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Link: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
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

  it('muestra los errores de todos los campos al enviar el formulario vacío', async () => {
    const { getByText, getByRole } = await render(<RegisterScreen />);
    fireEvent.press(getByRole('button', { name: 'Crear Cuenta' }));

    await waitFor(() => {
      expect(getByText('El nombre debe tener mínimo 2 caracteres')).toBeTruthy();
    }, WAIT);
    expect(getByText('El apellido debe tener mínimo 2 caracteres')).toBeTruthy();
    expect(getByText('El correo electrónico es requerido')).toBeTruthy();
    expect(getByText('La contraseña debe tener mínimo 8 caracteres')).toBeTruthy();
    expect(getByText('Debes aceptar los términos y condiciones')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('borra el error de un campo cuando el usuario lo corrige', async () => {
    const { getByText, queryByText, getByPlaceholderText, getByRole } = await render(
      <RegisterScreen />,
    );
    fireEvent.press(getByRole('button', { name: 'Crear Cuenta' }));
    await waitFor(() => expect(getByText('El correo electrónico es requerido')).toBeTruthy(), WAIT);

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'ana@test.com');

    await waitFor(() => expect(queryByText('El correo electrónico es requerido')).toBeNull(), WAIT);
  });
});
