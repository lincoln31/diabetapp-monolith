import { toApiError } from '@/src/shared/api/errors';
import { useStaleQuery } from '@/src/shared/cache/useStaleQuery';
import { glucoseApi } from '@/src/features/glucose';
import type { GlucoseReading } from '@/src/features/glucose';

const CACHE_KEY = 'dashboard.latestReading';

const fetchLatest = async (): Promise<GlucoseReading | null> => {
  const { items } = await glucoseApi.list({ page: 1, limit: 1 });
  return items[0] ?? null;
};

/**
 * Última medición para «Hoy» (spec fase 15, RF-15.3; con caché local desde la fase 18): la
 * lista viene del más reciente al más antiguo.
 */
export const useLatestReading = () => {
  const query = useStaleQuery<GlucoseReading | null>(
    CACHE_KEY,
    fetchLatest,
    (error) => toApiError(error).message,
  );

  return {
    status: query.status,
    reading: query.data,
    errorMessage: query.errorMessage,
    stale: query.stale,
    refresh: query.refresh,
  };
};
