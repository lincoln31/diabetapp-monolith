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
 * El plan gratuito de Render "duerme" el backend tras ~15 min sin tráfico: la primera
 * petición después de eso puede tardar 30-50 s en responder, más que `API_TIMEOUT_MS`
 * (spec fase 16, RNF-16.2).
 */
const COLD_START_TIMEOUT_MS = 45000;

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

  // Con más margen: si esto falla por tiempo agotado, es la llamada que más chance tiene de
  // toparse con el servidor recién despertando (pasó un rato desde el último uso).
  const response = await plain.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>(
    '/auth/refresh',
    { refreshToken: tokens.refreshToken },
    { timeout: COLD_START_TIMEOUT_MS },
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
    const config = error.config as
      | (AxiosRequestConfig & { _retry?: boolean; _coldStartRetry?: boolean })
      | undefined;
    const apiError = toApiError(error);

    // En vez de mostrar el error de una, se reintenta una sola vez con más margen: la
    // mayoría de las veces el servidor ya despertó y la petición pasa sola.
    if (apiError.code === 'NETWORK_ERROR' && config && !config._coldStartRetry) {
      config._coldStartRetry = true;
      config.timeout = COLD_START_TIMEOUT_MS;

      try {
        return await http(config);
      } catch (retryError) {
        return Promise.reject(toApiError(retryError));
      }
    }

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
      } catch (refreshError) {
        // Si el backend no respondió (el celular sin datos, o el *cold start* del plan
        // gratuito de Render: la primera petición tras un rato inactivo puede tardar
        // 30-50 s, más que API_TIMEOUT_MS) la sesión sigue siendo válida — no se sabe si el
        // token de renovación de verdad venció. Cerrar sesión aquí forzaba un login de más
        // cada vez que el servidor tardaba en despertar (hallazgo de uso real). Solo se cierra
        // la sesión cuando el backend respondió y dijo que el token ya no sirve.
        if (toApiError(refreshError).code !== 'NETWORK_ERROR') {
          await clearTokens();
          notifySessionExpired();
        }
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
