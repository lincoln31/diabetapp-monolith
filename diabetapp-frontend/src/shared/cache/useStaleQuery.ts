import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { readCache, writeCache } from './queryCache';

export interface StaleQueryState<T> {
  status: 'loading' | 'success' | 'error';
  data: T | null;
  errorMessage: string | null;
  /** `true` cuando lo que se ve en pantalla viene de la caché (o de la última carga que sí
   * funcionó) y todavía no se confirmó con el servidor en esta visita. */
  stale: boolean;
  refreshing: boolean;
}

/**
 * Carga con caché local «mientras tanto» (spec fase 18, RF-18.1 – RF-18.3): al abrir la
 * pantalla, si hay datos guardados de la última vez se muestran de inmediato (sin el spinner
 * de carga) mientras se pide la versión real en segundo plano. Si el pedido falla y ya hay
 * algo en pantalla —de la caché o de una carga anterior en esta sesión—, se queda tal cual:
 * el error solo aparece cuando no hay nada que mostrar. Pensado para el *cold start* del
 * backend gratuito de Render (30-50 s la primera vez), no para datos que cambian seguido.
 *
 * `fetcher` y `getErrorMessage` se leen de una ref: así `load` no cambia de identidad en
 * cada render (evita que `useFocusEffect` se vuelva a disparar de más).
 */
export const useStaleQuery = <T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  getErrorMessage: (error: unknown) => string,
) => {
  const [state, setState] = useState<StaleQueryState<T>>({
    status: 'loading',
    data: null,
    errorMessage: null,
    stale: false,
    refreshing: false,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const getErrorMessageRef = useRef(getErrorMessage);
  getErrorMessageRef.current = getErrorMessage;
  const hydrated = useRef(false);
  const loadedOnce = useRef(false);

  const load = useCallback(
    async (isRefresh: boolean) => {
      setState((prev) => ({
        ...prev,
        refreshing: isRefresh,
        status: prev.data ? prev.status : 'loading',
      }));

      try {
        const data = await fetcherRef.current();
        setState({ status: 'success', data, errorMessage: null, stale: false, refreshing: false });
        void writeCache(cacheKey, data);
      } catch (error) {
        setState((prev) =>
          prev.data
            ? { ...prev, refreshing: false }
            : {
                status: 'error',
                data: null,
                errorMessage: getErrorMessageRef.current(error),
                stale: false,
                refreshing: false,
              },
        );
      }
    },
    [cacheKey],
  );

  useFocusEffect(
    useCallback(() => {
      const start = async () => {
        if (!hydrated.current) {
          hydrated.current = true;
          const cached = await readCache<T>(cacheKey);

          if (cached !== null) {
            setState((prev) =>
              prev.data
                ? prev
                : {
                    status: 'success',
                    data: cached,
                    errorMessage: null,
                    stale: true,
                    refreshing: false,
                  },
            );
          }
        }

        void load(loadedOnce.current);
        loadedOnce.current = true;
      };

      void start();
    }, [cacheKey, load]),
  );

  return { ...state, refresh: useCallback(() => load(true), [load]) };
};
