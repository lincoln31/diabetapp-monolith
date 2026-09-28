import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { glucoseApi } from '@/src/features/glucose';
import type { GlucoseReading } from '@/src/features/glucose';

type Status = 'loading' | 'success' | 'error';

interface LatestState {
  status: Status;
  reading: GlucoseReading | null;
  errorMessage: string | null;
}

/** Última medición para «Hoy» (spec fase 15, RF-15.3): la lista viene del más reciente al más antiguo. */
export const useLatestReading = () => {
  const [state, setState] = useState<LatestState>({
    status: 'loading',
    reading: null,
    errorMessage: null,
  });

  const load = useCallback(async () => {
    try {
      const { items } = await glucoseApi.list({ page: 1, limit: 1 });
      setState({ status: 'success', reading: items[0] ?? null, errorMessage: null });
    } catch (error) {
      setState((current) => ({
        status: 'error',
        reading: current.reading,
        errorMessage: toApiError(error).message,
      }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { ...state, refresh: load };
};
