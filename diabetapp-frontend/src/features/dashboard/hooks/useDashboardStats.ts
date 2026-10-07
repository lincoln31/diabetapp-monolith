import { toApiError } from '@/src/shared/api/errors';
import { useStaleQuery } from '@/src/shared/cache/useStaleQuery';
import { dashboardApi } from '../api';
import { GlucoseStats } from '../types';

const CACHE_KEY = 'dashboard.stats';

/**
 * Estado del dashboard (spec fase 5, D-5.7; con caché local desde la fase 18): refresca al
 * volver a la pantalla (RF-5.13) y expone `refresh` para el deslizar-para-refrescar. Mientras
 * el backend despierta (*cold start*, fase 16), se ven los últimos datos guardados en vez de
 * la pantalla de carga (spec fase 18).
 */
export const useDashboardStats = () => {
  const query = useStaleQuery<GlucoseStats>(
    CACHE_KEY,
    () => dashboardApi.getStats(),
    (error) => toApiError(error).message,
  );

  const isEmpty = query.data ? query.data.periods['30'].count === 0 : false;
  const status = query.status === 'success' && isEmpty ? 'empty' : query.status;

  return {
    status,
    stats: query.data,
    errorMessage: query.errorMessage,
    stale: query.stale,
    refreshing: query.refreshing,
    refresh: query.refresh,
  };
};
