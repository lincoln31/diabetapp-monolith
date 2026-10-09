import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useSession } from '../AuthProvider';
import { clearTokens, getTokens, setTokens } from '@/src/shared/session/tokenStorage';

const mockMe = jest.fn();
jest.mock('../api', () => ({ authApi: { me: (...args: unknown[]) => mockMe(...args) } }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

/**
 * Restaurar la sesión al abrir la app (spec fase 2, RF-2.17; fase 18, D-18 sobre sesión sin red).
 */
describe('AuthProvider — restaurar sesión guardada', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await setTokens({ accessToken: 'viejo', refreshToken: 'r1' });
  });

  it('el servidor confirma la sesión: entra autenticado con el usuario', async () => {
    mockMe.mockResolvedValue({ user: { id: 'u1', firstName: 'Ana' } });

    const { result } = await renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user).toMatchObject({ firstName: 'Ana' });
  });

  it('sin red, entra igual sin borrar la sesión (aunque no confirme el usuario)', async () => {
    mockMe.mockRejectedValue({ isAxiosError: true, message: 'Network Error' });

    const { result } = await renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user).toBeNull();
    expect(await getTokens()).toEqual({ accessToken: 'viejo', refreshToken: 'r1' });
  });

  it('si el servidor dice que el token ya no sirve, pide iniciar sesión y lo borra', async () => {
    mockMe.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 401,
        data: { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sesión inválida' } },
      },
    });

    const { result } = await renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.user).toBeNull();
    expect(await getTokens()).toBeNull();
  });

  it('sin token guardado, pide iniciar sesión directamente', async () => {
    await clearTokens();

    const { result } = await renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(mockMe).not.toHaveBeenCalled();
  });
});
