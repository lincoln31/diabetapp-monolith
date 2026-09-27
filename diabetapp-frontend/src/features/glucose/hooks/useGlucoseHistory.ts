import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { glucoseApi } from '../api';
import { GlucoseReading } from '../types';

const DAY_MS = 86_400_000;
/** Máximo que devuelve la API por página; el resumen y el gráfico se calculan sobre esto. */
export const HISTORY_LIMIT = 200;

type Status = 'loading' | 'success' | 'error';

interface HistoryState {
  /** Período (en días) al que pertenecen los datos guardados. */
  days: number;
  status: Status;
  readings: GlucoseReading[];
  total: number;
  errorMessage: string | null;
  offline: boolean;
}

/**
 * Historial de glucosa de los últimos `days` días (spec fase 15, RF-15.5, D-15.4). Se recarga al
 * recuperar el foco (tras registrar, editar o borrar) y al cambiar el período. Mientras los
 * datos guardados son de otro período se muestra la carga; si ya hay datos del período actual,
 * se conservan mientras se refrescan.
 */
export const useGlucoseHistory = (days: number) => {
  const [state, setState] = useState<HistoryState>({
    days,
    status: 'loading',
    readings: [],
    total: 0,
    errorMessage: null,
    offline: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const from = new Date(Date.now() - days * DAY_MS).toISOString();
      const { items, meta } = await glucoseApi.list({ from, limit: HISTORY_LIMIT, page: 1 });
      setState({
        days,
        status: 'success',
        readings: items,
        total: meta.total,
        errorMessage: null,
        offline: false,
      });
    } catch (error) {
      const apiError = toApiError(error);
      setState((current) => {
        const sameDays = current.days === days;
        const readings = sameDays ? current.readings : [];

        return {
          days,
          status: readings.length > 0 ? 'success' : 'error',
          readings,
          total: sameDays ? current.total : 0,
          errorMessage: apiError.message,
          offline: apiError.code === 'NETWORK_ERROR',
        };
      });
    }
  }, [days]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, days, status: 'loading' }));
    void load();
  }, [load, days]);

  const stale = state.days !== days;

  return {
    status: stale ? ('loading' as const) : state.status,
    readings: stale ? [] : state.readings,
    total: stale ? 0 : state.total,
    errorMessage: state.errorMessage,
    offline: state.offline,
    refreshing,
    refresh,
    retry,
  };
};
