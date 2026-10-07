import { toApiError } from '@/src/shared/api/errors';
import { useStaleQuery } from '@/src/shared/cache/useStaleQuery';
import { hba1cApi } from '../api';
import { Hba1cProjection } from '../types';

const CACHE_KEY = 'dashboard.hba1c';

/**
 * Estado de la tarjeta de HbA1c (spec fase 6, D-6.7; con caché local desde la fase 18): igual
 * patrón que `useDashboardStats`.
 */
export const useHba1cProjection = () => {
  const query = useStaleQuery<Hba1cProjection>(
    CACHE_KEY,
    () => hba1cApi.getProjection(),
    (error) => toApiError(error).message,
  );

  return {
    status: query.status,
    projection: query.data,
    errorMessage: query.errorMessage,
    stale: query.stale,
    refresh: query.refresh,
  };
};
