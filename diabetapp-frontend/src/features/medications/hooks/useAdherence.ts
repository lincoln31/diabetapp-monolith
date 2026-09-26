import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { medicationsApi } from '../api';
import { AdherenceStats } from '../types';

type Status = 'loading' | 'success' | 'error';

interface AdherenceState {
  status: Status;
  adherence: AdherenceStats | null;
  errorMessage: string | null;
}

/** Estado de la tarjeta de adherencia (spec fase 11, D-11.5): mismo patrón que `useStreak`. */
export const useAdherence = () => {
  const [state, setState] = useState<AdherenceState>({
    status: 'loading',
    adherence: null,
    errorMessage: null,
  });

  const load = useCallback(async () => {
    try {
      const adherence = await medicationsApi.getAdherence();
      setState({ status: 'success', adherence, errorMessage: null });
    } catch (error) {
      setState({ status: 'error', adherence: null, errorMessage: toApiError(error).message });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { ...state, refresh: load };
};
