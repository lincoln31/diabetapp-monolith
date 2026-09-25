import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { dashboardApi } from '../api';
import { GlucoseStats } from '../types';

type Status = 'loading' | 'success' | 'error' | 'empty';

interface DashboardStatsState {
  status: Status;
  stats: GlucoseStats | null;
  errorMessage: string | null;
  refreshing: boolean;
}

/**
 * Estado del dashboard (spec fase 5, D-5.7): refresca al volver a la pantalla
 * (RF-5.13) y expone `refresh` para el deslizar-para-refrescar.
 * Sin caché ni librería de estado remoto: no hace falta a este tamaño (constitución P8).
 */
export const useDashboardStats = () => {
  const [state, setState] = useState<DashboardStatsState>({
    status: 'loading',
    stats: null,
    errorMessage: null,
    refreshing: false,
  });
  const loadedOnce = useRef(false);

  const load = useCallback(async (isRefresh: boolean) => {
    setState((prev) => ({ ...prev, refreshing: isRefresh, status: isRefresh ? prev.status : 'loading' }));

    try {
      const stats = await dashboardApi.getStats();
      const isEmpty = stats.periods['30'].count === 0;

      setState({ status: isEmpty ? 'empty' : 'success', stats, errorMessage: null, refreshing: false });
    } catch (error) {
      setState({
        status: 'error',
        stats: null,
        errorMessage: toApiError(error).message,
        refreshing: false,
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // La primera carga y cada vuelta a la pantalla (RF-5.13); no se muestra
      // el spinner de refresco en la primera carga.
      void load(loadedOnce.current);
      loadedOnce.current = true;
    }, [load]),
  );

  return { ...state, refresh: () => load(true) };
};
