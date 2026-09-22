// src/api/apiClient.ts

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Alert } from 'react-native';
import { API_CONFIG } from '../constants/config';
import { notifySessionExpired } from '../session/sessionEvents';
import { clearTokens, getTokens, setTokens } from '../session/tokenStorage';

/**
 * Contrato de la API (specs/fase-1-bases-backend).
 * Éxito: { success: true, data, meta? } · Error: { success: false, error: { code, message, fields? } }
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EMAIL_IN_USE'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'; // Solo del lado de la app: sin respuesta del servidor

export interface ApiFieldError {
  /** Vacío cuando el error no es de un campo concreto, sino del formulario. */
  field: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: ApiFieldError[];
  };
}

export interface NormalizedApiError {
  code: ApiErrorCode;
  message: string;
  fields?: ApiFieldError[];
}

/**
 * Convierte cualquier error de una petición en { code, message, fields }.
 * Las pantallas deciden según `code`, nunca según el texto ni el código HTTP.
 */
export const getApiError = (error: unknown): NormalizedApiError => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;

    if (body?.error?.code) {
      return { code: body.error.code, message: body.error.message, fields: body.error.fields };
    }

    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor. Revisa tu conexión.',
      };
    }
  }

  return { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado. Intenta de nuevo.' };
};

/** Primer mensaje de campo, si el error trae detalle de validación. */
export const getFirstFieldMessage = (error: NormalizedApiError): string | undefined =>
  error.fields?.[0]?.message;

// Creamos la instancia de Axios con la configuración centralizada
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** Instancia sin interceptores: renovar no debe disparar otra renovación. */
const plainClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: { 'Content-Type': 'application/json' },
});

// Añade el token de acceso a cada petición
apiClient.interceptors.request.use(async (config) => {
  const tokens = await getTokens();

  if (tokens) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
});

/**
 * Renovación única: si varias peticiones caducan a la vez, todas esperan
 * la misma promesa y se repiten con el token nuevo (spec fase 2, RF-2.19).
 */
let refreshing: Promise<string> | null = null;

const doRefresh = async (): Promise<string> => {
  const tokens = await getTokens();

  if (!tokens) {
    throw new Error('SIN_SESION');
  }

  const response = await plainClient.post(API_CONFIG.endpoints.auth.refresh, {
    refreshToken: tokens.refreshToken,
  });

  const { accessToken, refreshToken } = response.data.data;
  await setTokens({ accessToken, refreshToken });

  return accessToken;
};

const isAuthEndpoint = (url?: string): boolean =>
  !!url && (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register'));

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const apiError = getApiError(error);

    if (apiError.code === 'TOKEN_EXPIRED' && config && !config._retry && !isAuthEndpoint(config.url)) {
      config._retry = true;

      try {
        refreshing = refreshing ?? doRefresh().finally(() => (refreshing = null));
        const accessToken = await refreshing;

        config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
        return apiClient(config);
      } catch {
        // La renovación falló: la sesión terminó de verdad
        await clearTokens();
        notifySessionExpired();
      }
    }

    if (apiError.code === 'INTERNAL_ERROR' && error.response) {
      // Error del servidor: la pantalla no puede hacer nada útil con el detalle
      Alert.alert(
        'Error del Servidor',
        'Ha ocurrido un problema en nuestros sistemas. Intenta de nuevo más tarde.',
      );
    }

    return Promise.reject(error);
  },
);

export default apiClient;
