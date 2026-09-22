import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import apiClient, { getApiError, getFirstFieldMessage } from '../api/apiClient';
import { API_CONFIG } from '../constants/config';
import { onSessionExpired } from './sessionEvents';
import { clearTokens, getTokens, removeLegacyToken, setTokens } from './tokenStorage';
import {
  dateOfBirthToISO,
  validateDateOfBirth,
  validateEmail,
  validateNewPassword,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
  validateRequired,
  ValidationResult,
} from '../utils/validation';

export interface SessionUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  typeOfDiabetes?: string | null;
  onboardingCompleted: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}

/** Estado de sesión conocido por toda la app (spec fase 2, RF-2.17). */
type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionContextValue {
  status: SessionStatus;
  user: SessionUser | null;
  isSubmitting: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (data: RegisterData) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const messageForError = (error: ReturnType<typeof getApiError>): string => {
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'El correo o la contraseña no son válidos. Verifica e intenta nuevamente.';
    case 'EMAIL_IN_USE':
      return 'Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.';
    case 'RATE_LIMITED':
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    case 'VALIDATION_ERROR':
      return getFirstFieldMessage(error) ?? error.message;
    default:
      return error.message;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        const response = await apiClient.get(API_CONFIG.endpoints.auth.me);
        if (!cancelled) {
          setUser(response.data.data.user);
          setStatus('authenticated');
        }
      } catch (error) {
        const apiError = getApiError(error);

        // Sin conexión no se expulsa al paciente: el token sigue guardado
        if (apiError.code === 'NETWORK_ERROR') {
          if (!cancelled) setStatus('unauthenticated');
          return;
        }

        await clearTokens();
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

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    const validations: ValidationResult[] = [validateEmail(email), validatePassword(password)];
    const firstError = validations.find((v) => !v.isValid);

    if (firstError) {
      Alert.alert('Error', firstError.message);
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(API_CONFIG.endpoints.auth.login, {
        email: email.trim().toLowerCase(),
        password, // La contraseña se envía tal cual la escribió el usuario (RF-2.22)
      });

      const { user: loggedUser, accessToken, refreshToken } = response.data.data;
      await setTokens({ accessToken, refreshToken });

      setUser(loggedUser);
      setStatus('authenticated');
      return true;
    } catch (error) {
      const apiError = getApiError(error);
      console.error('Error en el login:', apiError.code);
      Alert.alert('No se pudo iniciar sesión', messageForError(apiError));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signUp = useCallback(async (data: RegisterData): Promise<boolean> => {
    const phone = data.phone.replace(/\s/g, '');

    const validations: ValidationResult[] = [
      validateRequired(data.firstName, 'El nombre'),
      validateRequired(data.lastName, 'El apellido'),
      validateEmail(data.email),
      phone ? validatePhone(phone) : { isValid: true }, // El teléfono es opcional
      validateDateOfBirth(data.dateOfBirth.trim()),
      validateNewPassword(data.password),
      validatePasswordConfirmation(data.password, data.confirmPassword),
    ];
    const firstError = validations.find((v) => !v.isValid);

    if (firstError) {
      Alert.alert('Error', firstError.message);
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(API_CONFIG.endpoints.auth.register, {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: phone || undefined,
        birthDate: dateOfBirthToISO(data.dateOfBirth.trim()),
        password: data.password,
      });

      const { user: newUser, accessToken, refreshToken } = response.data.data;
      await setTokens({ accessToken, refreshToken });

      setUser(newUser);
      setStatus('authenticated');
      return true;
    } catch (error) {
      const apiError = getApiError(error);
      console.error('Error en el registro:', apiError.code);
      Alert.alert('No se pudo crear la cuenta', messageForError(apiError));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const tokens = await getTokens();

    try {
      if (tokens) {
        await apiClient.post(API_CONFIG.endpoints.auth.logout, {
          refreshToken: tokens.refreshToken,
        });
      }
    } catch (error) {
      // Aunque el servidor no responda, la sesión local se cierra igual (RF-2.21)
      console.error('Error al cerrar sesión:', getApiError(error).code);
    } finally {
      await clearTokens();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  return (
    <SessionContext.Provider value={{ status, user, isSubmitting, signIn, signUp, signOut }}>
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
