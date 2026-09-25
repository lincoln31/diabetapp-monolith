import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { streakApi } from '../api';
import { StreakStats } from '../types';

type Status = 'loading' | 'success' | 'error';

interface StreakState {
  status: Status;
  streak: StreakStats | null;
  errorMessage: string | null;
}

/**
 * Estado de la tarjeta de racha (spec fase 8, D-8.5): cada tarjeta pide sus
 * propios datos, mismo patrón que `useHba1cProjection`.
 */
export const useStreak = () => {
  const [state, setState] = useState<StreakState>({
    status: 'loading',
    streak: null,
    errorMessage: null,
  });

  const load = useCallback(async () => {
    try {
      const streak = await streakApi.getStreak();
      setState({ status: 'success', streak, errorMessage: null });
    } catch (error) {
      setState({ status: 'error', streak: null, errorMessage: toApiError(error).message });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { ...state, refresh: load };
};
