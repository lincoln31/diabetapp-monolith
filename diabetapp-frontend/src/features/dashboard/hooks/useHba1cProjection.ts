import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { hba1cApi } from '../api';
import { Hba1cProjection } from '../types';

type Status = 'loading' | 'success' | 'error';

interface Hba1cState {
  status: Status;
  projection: Hba1cProjection | null;
  errorMessage: string | null;
}

/**
 * Estado de la tarjeta de HbA1c (spec fase 6, D-6.7): cada tarjeta pide sus
 * propios datos, igual patrón que `useDashboardStats` de la fase 5.
 */
export const useHba1cProjection = () => {
  const [state, setState] = useState<Hba1cState>({
    status: 'loading',
    projection: null,
    errorMessage: null,
  });

  const load = useCallback(async () => {
    try {
      const projection = await hba1cApi.getProjection();
      setState({ status: 'success', projection, errorMessage: null });
    } catch (error) {
      setState({ status: 'error', projection: null, errorMessage: toApiError(error).message });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return state;
};
