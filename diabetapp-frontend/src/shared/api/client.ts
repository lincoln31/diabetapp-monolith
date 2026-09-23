import { create as createAxios, AxiosError, AxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { notifySessionExpired } from '../session/sessionEvents';
import { clearTokens, getTokens, setTokens } from '../session/tokenStorage';
import { toApiError } from './errors';
import { ApiSuccess, Paginated } from './types';

/**
 * Cliente HTTP. No muestra alertas (spec fase 3, RF-3.9): cada pantalla decide
 * qué mostrar a partir del `ApiError` que recibe.
 */
const http = createAxios({
  baseURL: env.API_URL,
  timeout: env.API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** Instancia sin interceptores: renovar no debe disparar otra renovación. */
const plain = createAxios({ baseURL: env.API_URL, timeout: env.API_TIMEOUT_MS });

http.interceptors.request.use(async (config) => {
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

  const response = await plain.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>(
    '/auth/refresh',
    { refreshToken: tokens.refreshToken },
  );

  const { accessToken, refreshToken } = response.data.data;
  await setTokens({ accessToken, refreshToken });

  return accessToken;
};

const isAuthEndpoint = (url?: string): boolean =>
  !!url && ['/auth/refresh', '/auth/login', '/auth/register'].some((path) => url.includes(path));

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const apiError = toApiError(error);

    if (
      apiError.code === 'TOKEN_EXPIRED' &&
      config &&
      !config._retry &&
      !isAuthEndpoint(config.url)
    ) {
      config._retry = true;

      try {
        refreshing = refreshing ?? doRefresh().finally(() => (refreshing = null));
        const accessToken = await refreshing;

        config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
        return http(config);
      } catch {
        // La renovación falló: la sesión terminó de verdad
        await clearTokens();
        notifySessionExpired();
      }
    }

    return Promise.reject(apiError);
  },
);

/**
 * Helpers que devuelven directamente el `data` del contrato, ya tipado
 * (spec fase 3, RF-3.6). Las pantallas nunca ven axios.
 */
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  (await http.get<ApiSuccess<T>>(url, config)).data.data;

export const getPaginated = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<Paginated<T>> => {
  const { data } = await http.get<ApiSuccess<T[]>>(url, config);

  return {
    items: data.data,
    meta: data.meta ?? { page: 1, limit: data.data.length, total: data.data.length, totalPages: 1 },
  };
};

export const post = async <T>(url: string, body?: unknown): Promise<T> =>
  (await http.post<ApiSuccess<T>>(url, body)).data.data;

export const put = async <T>(url: string, body?: unknown): Promise<T> =>
  (await http.put<ApiSuccess<T>>(url, body)).data.data;

export const del = async <T>(url: string): Promise<T> =>
  (await http.delete<ApiSuccess<T>>(url)).data.data;

/**
 * Descarga un archivo (no sigue el contrato `{ success, data }`: el body es
 * el archivo tal cual) — spec fase 6, D-6.6. `'text'` para CSV, `'arraybuffer'`
 * para binarios como PDF.
 */
export const getFile = async (
  url: string,
  responseType: 'text' | 'arraybuffer',
): Promise<string | ArrayBuffer> => (await http.get(url, { responseType })).data;
