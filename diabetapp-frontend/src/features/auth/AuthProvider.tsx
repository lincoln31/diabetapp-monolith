import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError, toApiError } from '@/src/shared/api/errors';
import { onSessionExpired } from '@/src/shared/session/sessionEvents';
import {
  clearTokens,
  getTokens,
  removeLegacyToken,
  setTokens,
} from '@/src/shared/session/tokenStorage';
import { authApi } from './api';
import { RegisterPayload, User } from './types';

/** Estado de sesión conocido por toda la app (spec fase 2, RF-2.17). */
type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const expiredAlertShown = useRef(false);

  // Arranque: ¿hay una sesión guardada que siga siendo válida?
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      await removeLegacyToken();
      const tokens = await getTokens();

      if (!tokens) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }

      try {
        const { user: currentUser } = await authApi.me();
        if (!cancelled) {
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch (error) {
        // Sin conexión no se borra la sesión guardada: solo se pide iniciar sesión
        if (toApiError(error).code !== 'NETWORK_ERROR') {
          await clearTokens();
        }

        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // El cliente HTTP avisa cuando la renovación falló de verdad (RF-2.20)
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus('unauthenticated');

        if (!expiredAlertShown.current) {
          expiredAlertShown.current = true;
          Alert.alert('Sesión finalizada', 'Tu sesión expiró. Inicia sesión de nuevo.', [
            { text: 'Entendido', onPress: () => (expiredAlertShown.current = false) },
          ]);
        }
      }),
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    // La contraseña se envía tal cual la escribió el usuario (RF-2.22)
    const result = await authApi.login(email.trim().toLowerCase(), password);

    await setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const result = await authApi.register(payload);

    await setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    const tokens = await getTokens();

    try {
      if (tokens) {
        await authApi.logout(tokens.refreshToken);
      }
    } catch (error) {
      // Aunque el servidor no responda, la sesión local se cierra igual (RF-2.21)
      console.error('Error al cerrar sesión:', (error as ApiError).code);
    } finally {
      await clearTokens();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  return (
    <SessionContext.Provider value={{ status, user, signIn, signUp, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession debe usarse dentro de <AuthProvider>');
  }

  return context;
};
