import { toApiError } from '@/src/shared/api/errors';
import { useStaleQuery } from '@/src/shared/cache/useStaleQuery';
import { streakApi } from '../api';
import { StreakStats } from '../types';

const CACHE_KEY = 'dashboard.streak';

/**
 * Estado de la tarjeta de racha (spec fase 8, D-8.5; con caché local desde la fase 18): mismo
 * patrón que `useHba1cProjection`.
 */
export const useStreak = () => {
  const query = useStaleQuery<StreakStats>(
    CACHE_KEY,
    () => streakApi.getStreak(),
    (error) => toApiError(error).message,
  );

  return {
    status: query.status,
    streak: query.data,
    errorMessage: query.errorMessage,
    stale: query.stale,
    refresh: query.refresh,
  };
};
